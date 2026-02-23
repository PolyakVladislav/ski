import { useState, useEffect } from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudFog,
  Wind,
  Snowflake,
  MapPin,
  ExternalLink,
  CloudSun,
  Droplets,
  Eye,
  Mountain,
  X,
  ZoomIn,
} from 'lucide-react';
import { createPortal } from 'react-dom';

const LAT = 45.2983;
const LON = 6.5847;

const ELEVATIONS = [
  { label: 'כפר', labelEn: 'Village', elevation: 2300, color: 'text-green-500' },
  { label: 'אמצע', labelEn: 'Mid', elevation: 2700, color: 'text-amber-500' },
  { label: 'פסגה', labelEn: 'Cime de Caron', elevation: 3230, color: 'text-sky-400' },
] as const;

interface ElevationTemp {
  elevation: number;
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  weatherCode: number;
}

interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  humidity: number;
  weatherCode: number;
  visibility: number;
  snowDepth: number;
}

interface DayForecast {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipProb: number;
  snowfall: number;
  windMax: number;
}

interface WeatherData {
  current: CurrentWeather;
  daily: DayForecast[];
}

function weatherIcon(code: number, size: number) {
  if (code === 0) return <Sun size={size} className="text-amber-400" />;
  if (code <= 3) return <CloudSun size={size} className="text-gray-400" />;
  if (code <= 49) return <CloudFog size={size} className="text-gray-400" />;
  if (code <= 69) return <CloudRain size={size} className="text-blue-400" />;
  if (code <= 79) return <CloudSnow size={size} className="text-sky-300" />;
  if (code <= 82) return <CloudRain size={size} className="text-blue-500" />;
  if (code <= 86) return <CloudSnow size={size} className="text-sky-200" />;
  return <Cloud size={size} className="text-gray-400" />;
}

function weatherLabel(code: number): string {
  if (code === 0) return 'שמש';
  if (code <= 3) return 'מעונן חלקית';
  if (code <= 49) return 'ערפל';
  if (code <= 59) return 'גשם קל';
  if (code <= 69) return 'גשם ושלג';
  if (code <= 75) return 'שלג';
  if (code <= 79) return 'גרגירי שלג';
  if (code <= 82) return 'גשם חזק';
  if (code <= 86) return 'שלג כבד';
  return 'מעונן';
}

function dayNameHe(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  return days[d.getDay()];
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const USEFUL_LINKS = [
  { label: 'מפת מסלולים אינטראקטיבית', url: 'https://www.valthorens.com/en/mountain/interactive-map/', icon: MapPin },
  { label: 'מצלמות רשת', url: 'https://www.valthorens.com/en/mountain/webcams/', icon: Eye },
  { label: 'אתר Val Thorens הרשמי', url: 'https://www.valthorens.com/en/', icon: ExternalLink },
  { label: 'מפת 3 Vallées', url: 'https://www.les3vallees.com/en/ski-area/ski-map/', icon: MapPin },
];

const WEATHER_CACHE_KEY = 'weather-cache';

function saveWeatherCache(weather: WeatherData, temps: ElevationTemp[]) {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ weather, temps, ts: Date.now() }));
  } catch {}
}

function loadWeatherCache(): { weather: WeatherData; temps: ElevationTemp[] } | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { weather: parsed.weather, temps: parsed.temps };
  } catch {
    return null;
  }
}

export function ResortTab() {
  const cached = loadWeatherCache();
  const [weather, setWeather] = useState<WeatherData | null>(cached?.weather ?? null);
  const [elevationTemps, setElevationTemps] = useState<ElevationTemp[]>(cached?.temps ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [fromCache, setFromCache] = useState(!!cached);

  useEffect(() => {
    const mainUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility,snow_depth&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,snowfall_sum,wind_speed_10m_max&timezone=Europe/Paris&forecast_days=7`;

    const elevationUrls = ELEVATIONS.map(
      (e) => `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&elevation=${e.elevation}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Europe/Paris`
    );

    Promise.all([
      fetch(mainUrl).then((r) => r.json()),
      ...elevationUrls.map((u) => fetch(u).then((r) => r.json())),
    ])
      .then(([data, ...elevData]) => {
        const current: CurrentWeather = {
          temperature: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          windSpeed: Math.round(data.current.wind_speed_10m),
          humidity: data.current.relative_humidity_2m,
          weatherCode: data.current.weather_code,
          visibility: Math.round((data.current.visibility ?? 10000) / 1000),
          snowDepth: Math.round((data.current.snow_depth ?? 0) * 100),
        };

        const daily: DayForecast[] = data.daily.time.map((date: string, i: number) => ({
          date,
          dayName: dayNameHe(date),
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          weatherCode: data.daily.weather_code[i],
          precipProb: data.daily.precipitation_probability_max[i],
          snowfall: Math.round(data.daily.snowfall_sum[i] * 10) / 10,
          windMax: Math.round(data.daily.wind_speed_10m_max[i]),
        }));

        const temps: ElevationTemp[] = elevData.map((d: any, i: number) => ({
          elevation: ELEVATIONS[i].elevation,
          temperature: Math.round(d.current.temperature_2m),
          feelsLike: Math.round(d.current.apparent_temperature),
          windSpeed: Math.round(d.current.wind_speed_10m),
          weatherCode: d.current.weather_code,
        }));

        setWeather({ current, daily });
        setElevationTemps(temps);
        setFromCache(false);
        saveWeatherCache({ current, daily }, temps);
        setLoading(false);
      })
      .catch(() => {
        if (!cached) setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-ios-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <Cloud size={48} className="mx-auto text-ios-gray3 mb-3" />
        <p className="text-[17px] font-medium text-ios-label3">לא ניתן לטעון נתוני מזג אוויר</p>
        <p className="text-[13px] text-ios-gray mt-1">בדוק את החיבור לאינטרנט</p>
      </div>
    );
  }

  const { current, daily } = weather;
  const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString();

  return (
    <div className="space-y-4 pb-20">
      {/* Current weather hero */}
      <div className="bg-gradient-to-bl from-sky-600 to-blue-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-3 left-6 opacity-10">
          <Snowflake size={80} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className="text-sky-300" />
            <span className="text-sky-200 text-[13px] font-medium">
              Val Thorens · 2,300m{fromCache ? ' · שמור' : ''}
            </span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[56px] font-light leading-none" dir="ltr">
                {current.temperature}°
              </div>
              <div className="text-[15px] text-white/80 mt-1">{weatherLabel(current.weatherCode)}</div>
              <div className="text-[13px] text-white/50 mt-0.5" dir="ltr">
                מרגיש כמו {current.feelsLike}°
              </div>
            </div>
            <div className="mt-2">
              {weatherIcon(current.weatherCode, 52)}
            </div>
          </div>
        </div>
      </div>

      {/* Temperature by elevation */}
      {elevationTemps.length > 0 && (
        <div className="animate-fade-in-up stagger-1">
          <p className="text-[13px] font-medium text-ios-gray px-1 pb-2">טמפרטורה לפי גובה</p>
          <div className="ios-card overflow-hidden">
            {ELEVATIONS.map((elev, i) => {
              const data = elevationTemps[i];
              if (!data) return null;
              return (
                <div
                  key={elev.elevation}
                  className={`flex items-center px-4 py-[11px] ${i > 0 ? 'border-t border-ios-separator' : ''}`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <Mountain size={16} className={`${elev.color} shrink-0`} />
                    <div className="min-w-0">
                      <div className="text-[15px] text-ios-label font-medium">{elev.label}</div>
                      <div className="text-[11px] text-ios-gray" dir="ltr">{elev.elevation.toLocaleString()}m</div>
                    </div>
                  </div>
                  <div className="shrink-0 w-7 flex justify-center">
                    {weatherIcon(data.weatherCode, 16)}
                  </div>
                  <div className="shrink-0 flex items-center gap-3 ms-3">
                    <div className="text-left">
                      <div className="text-[17px] font-semibold text-ios-label" dir="ltr">{data.temperature}°</div>
                      <div className="text-[11px] text-ios-gray" dir="ltr">מרגיש {data.feelsLike}°</div>
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] text-ios-gray flex items-center gap-0.5" dir="ltr">
                        <Wind size={10} />
                        {data.windSpeed} km/h
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current conditions grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 animate-fade-in-up stagger-2">
        <div className="ios-card px-4 py-3 flex items-center gap-3">
          <Wind size={20} className="text-ios-blue shrink-0" />
          <div>
            <div className="text-[11px] text-ios-gray">רוח</div>
            <div className="text-[15px] font-semibold text-ios-label" dir="ltr">{current.windSpeed} km/h</div>
          </div>
        </div>
        <div className="ios-card px-4 py-3 flex items-center gap-3">
          <Droplets size={20} className="text-ios-blue shrink-0" />
          <div>
            <div className="text-[11px] text-ios-gray">לחות</div>
            <div className="text-[15px] font-semibold text-ios-label" dir="ltr">{current.humidity}%</div>
          </div>
        </div>
        <div className="ios-card px-4 py-3 flex items-center gap-3">
          <Snowflake size={20} className="text-sky-400 shrink-0" />
          <div>
            <div className="text-[11px] text-ios-gray">עומק שלג</div>
            <div className="text-[15px] font-semibold text-ios-label" dir="ltr">{current.snowDepth} cm</div>
          </div>
        </div>
        <div className="ios-card px-4 py-3 flex items-center gap-3">
          <Eye size={20} className="text-ios-gray shrink-0" />
          <div>
            <div className="text-[11px] text-ios-gray">ראות</div>
            <div className="text-[15px] font-semibold text-ios-label" dir="ltr">{current.visibility} km</div>
          </div>
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="animate-fade-in-up stagger-3">
        <p className="text-[13px] font-medium text-ios-gray px-1 pb-2">תחזית 7 ימים</p>
        <div className="ios-card overflow-hidden">
          {daily.map((day, i) => (
            <div
              key={day.date}
              className={`flex items-center px-4 py-[10px] ${i > 0 ? 'border-t border-ios-separator' : ''}`}
            >
              <span className={`w-16 text-[15px] shrink-0 ${isToday(day.date) ? 'font-bold text-ios-blue' : 'text-ios-label'}`}>
                {isToday(day.date) ? 'היום' : day.dayName}
              </span>
              <span className="text-[11px] text-ios-gray w-12 shrink-0" dir="ltr">{formatDateShort(day.date)}</span>
              <div className="shrink-0 w-7 flex justify-center">
                {weatherIcon(day.weatherCode, 18)}
              </div>
              {day.snowfall > 0 && (
                <span className="text-[11px] text-sky-400 font-medium w-12 text-center shrink-0" dir="ltr">
                  {day.snowfall}cm
                </span>
              )}
              {day.snowfall === 0 && day.precipProb > 30 && (
                <span className="text-[11px] text-ios-blue font-medium w-12 text-center shrink-0" dir="ltr">
                  {day.precipProb}%
                </span>
              )}
              {day.snowfall === 0 && day.precipProb <= 30 && (
                <span className="w-12 shrink-0" />
              )}
              <div className="flex-1 flex items-center justify-end gap-1" dir="ltr">
                <span className="text-[15px] font-semibold text-ios-label w-8 text-right">{day.tempMax}°</span>
                <div className="w-16 h-[4px] bg-ios-gray5 rounded-full overflow-hidden mx-1">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-orange-400"
                    style={{
                      marginLeft: `${Math.max(0, ((day.tempMin + 15) / 30) * 100)}%`,
                      width: `${Math.max(10, ((day.tempMax - day.tempMin) / 30) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[15px] text-ios-gray w-8">{day.tempMin}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Piste map */}
      <div className="animate-fade-in-up stagger-4">
        <p className="text-[13px] font-medium text-ios-gray px-1 pb-2">מפת מסלולים</p>
        <button
          onClick={() => setShowMap(true)}
          className="block w-full ios-card overflow-hidden active:scale-[0.98] transition-all text-right"
        >
          <div className="relative w-full h-48 bg-ios-gray6 overflow-hidden">
            <img
              src="/piste-map-preview.png"
              alt="3 Vallées Piste Map"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1">
              <ZoomIn size={12} />
              לחץ להגדלה
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[15px] font-medium text-ios-label">מפת מסלולים 3 Vallées</div>
              <div className="text-[13px] text-ios-gray">עונה 2025–2026 · PDF</div>
            </div>
            <ZoomIn size={16} className="text-ios-gray3" />
          </div>
        </button>
      </div>

      {/* Fullscreen PDF viewer */}
      {showMap && createPortal(
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
          <div className="shrink-0 flex items-center justify-between px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 bg-black/80 backdrop-blur-xl">
            <h2 className="text-[17px] font-semibold text-white">מפת מסלולים</h2>
            <button
              onClick={() => setShowMap(false)}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center active:bg-white/30 transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <iframe
              src="/plan-3-vallees-25.26-bd.pdf"
              className="w-full h-full border-none"
              title="Piste Map"
            />
          </div>
        </div>,
        document.body
      )}

      {/* Useful links */}
      <div className="animate-fade-in-up stagger-5">
        <p className="text-[13px] font-medium text-ios-gray px-1 pb-2">קישורים שימושיים</p>
        <div className="ios-card overflow-hidden md:grid md:grid-cols-2">
          {USEFUL_LINKS.map((link, i) => {
            const Icon = link.icon;
            return (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-4 py-[11px] active:bg-ios-gray6 transition-colors ${
                  i > 0 ? 'border-t border-ios-separator' : ''
                }`}
              >
                <div className="w-[29px] h-[29px] rounded-[7px] bg-ios-blue flex items-center justify-center text-white shrink-0">
                  <Icon size={15} />
                </div>
                <span className="text-[17px] text-ios-label flex-1">{link.label}</span>
                <ExternalLink size={14} className="text-ios-gray3 shrink-0" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
