/**
 * DisasterChain Weather & Atmospheric Intelligence Utilities
 * Centralized WMO Weather Code Mappings, AQI Severity, Wind Compass, and Atmospheric Risk Analysis
 */

export const WMO_WEATHER_CODES = {
  0: { label: 'Clear Sky', icon: '☀️', condition: 'clear' },
  1: { label: 'Mainly Clear', icon: '🌤️', condition: 'mainly_clear' },
  2: { label: 'Partly Cloudy', icon: '⛅', condition: 'partly_cloudy' },
  3: { label: 'Overcast', icon: '☁️', condition: 'overcast' },
  45: { label: 'Fog', icon: '🌫️', condition: 'fog' },
  48: { label: 'Depositing Rime Fog', icon: '🌫️', condition: 'fog' },
  51: { label: 'Light Drizzle', icon: '🌦️', condition: 'drizzle' },
  53: { label: 'Moderate Drizzle', icon: '🌦️', condition: 'drizzle' },
  55: { label: 'Dense Drizzle', icon: '🌧️', condition: 'drizzle' },
  56: { label: 'Light Freezing Drizzle', icon: '🌧️', condition: 'freezing_rain' },
  57: { label: 'Dense Freezing Drizzle', icon: '🌧️', condition: 'freezing_rain' },
  61: { label: 'Slight Rain', icon: '🌧️', condition: 'rain' },
  63: { label: 'Moderate Rain', icon: '🌧️', condition: 'rain' },
  65: { label: 'Heavy Rain', icon: '🌧️', condition: 'heavy_rain' },
  66: { label: 'Light Freezing Rain', icon: '🌨️', condition: 'freezing_rain' },
  67: { label: 'Heavy Freezing Rain', icon: '🌨️', condition: 'freezing_rain' },
  71: { label: 'Slight Snow Fall', icon: '❄️', condition: 'snow' },
  73: { label: 'Moderate Snow Fall', icon: '❄️', condition: 'snow' },
  75: { label: 'Heavy Snow Fall', icon: '❄️', condition: 'heavy_snow' },
  77: { label: 'Snow Grains', icon: '❄️', condition: 'snow' },
  80: { label: 'Slight Rain Showers', icon: '🌦️', condition: 'showers' },
  81: { label: 'Moderate Rain Showers', icon: '🌧️', condition: 'showers' },
  82: { label: 'Violent Rain Showers', icon: '⛈️', condition: 'heavy_rain' },
  85: { label: 'Slight Snow Showers', icon: '🌨️', condition: 'snow' },
  86: { label: 'Heavy Snow Showers', icon: '🌨️', condition: 'heavy_snow' },
  95: { label: 'Thunderstorm', icon: '⛈️', condition: 'thunderstorm' },
  96: { label: 'Thunderstorm with Slight Hail', icon: '⛈️', condition: 'thunderstorm_hail' },
  99: { label: 'Thunderstorm with Heavy Hail', icon: '⛈️', condition: 'thunderstorm_hail' },
};

/**
 * Resolves WMO code to human-readable label and icon
 */
export function getWeatherCondition(code) {
  if (code == null || WMO_WEATHER_CODES[code] == null) {
    return { label: 'Clear / Normal', icon: '🌤️', condition: 'clear' };
  }
  return WMO_WEATHER_CODES[code];
}

/**
 * Converts wind degrees (0-360) to cardinal direction
 */
export function degreesToCardinal(deg) {
  if (deg == null || isNaN(deg)) return 'N';
  const val = Math.floor((deg / 22.5) + 0.5);
  const arr = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  return arr[val % 16];
}

/**
 * European Air Quality Index (EAQI) classification & color
 */
export function getAqiDetails(aqiValue) {
  const aqi = parseFloat(aqiValue);
  if (isNaN(aqi) || aqi == null) {
    return {
      severity: 'UNKNOWN',
      label: 'Unavailable',
      color: 'var(--text-muted)',
      badgeClass: 'badge-secondary',
      advisory: 'Air quality telemetry is currently calibrating.',
    };
  }

  if (aqi <= 20) {
    return {
      severity: 'GOOD',
      label: 'GOOD',
      color: 'var(--mint)',
      badgeClass: 'badge-success',
      advisory: 'Air quality is satisfactory. Atmospheric pollution poses minimal risk.',
    };
  }
  if (aqi <= 40) {
    return {
      severity: 'FAIR',
      label: 'FAIR',
      color: 'var(--cyan)',
      badgeClass: 'badge-info',
      advisory: 'Air quality is acceptable. Sensitive individuals should monitor symptoms.',
    };
  }
  if (aqi <= 60) {
    return {
      severity: 'MODERATE',
      label: 'MODERATE',
      color: 'var(--amber)',
      badgeClass: 'badge-warning',
      advisory: 'Respiratory symptoms possible for vulnerable individuals, elderly and children.',
    };
  }
  if (aqi <= 80) {
    return {
      severity: 'POOR',
      label: 'POOR',
      color: 'var(--accent-orange)',
      badgeClass: 'badge-warning',
      advisory: 'Adverse health effects possible for general public; reduce strenuous outdoor activities.',
    };
  }
  if (aqi <= 100) {
    return {
      severity: 'VERY POOR',
      label: 'VERY POOR',
      color: 'var(--crimson)',
      badgeClass: 'badge-critical',
      advisory: 'High health warning: wear particulate filtering masks (N95) outdoors.',
    };
  }
  return {
    severity: 'EXTREMELY POOR',
    label: 'EXTREMELY POOR',
    color: '#990022',
    badgeClass: 'badge-critical',
    advisory: 'Emergency atmospheric alert: entire population likely affected. Remain indoors.',
  };
}

/**
 * Atmospheric Risk Context Evaluator
 * Analyzes observable conditions against practical safety thresholds.
 * Returns derived advisory context (NOT an official civil defense warning).
 */
export function evaluateAtmosphericRisk(currentWeather, airQuality, activeCyclones = []) {
  const risks = [];

  if (!currentWeather) {
    return {
      hasRisks: false,
      risks: [],
      headline: 'NO SIGNIFICANT WEATHER HAZARD DETECTED',
      badgeClass: 'badge-success',
      disclaimer: 'Advisory context — not an official warning.',
    };
  }

  const { temperature, windSpeed, windGusts, precipitation, rain, weatherCode, visibilityKm } = currentWeather;

  // 1. High Wind Risk
  if ((windSpeed && windSpeed >= 45) || (windGusts && windGusts >= 60)) {
    risks.push({
      type: 'WIND',
      severity: windSpeed >= 65 || windGusts >= 80 ? 'CRITICAL' : 'WARNING',
      title: 'HIGH WIND HAZARD',
      detail: `Observed sustained wind: ${windSpeed} km/h (Gusts: ${windGusts || windSpeed} km/h). Loose debris, fallen tree branches, and power line damage hazards present.`,
      icon: '💨',
    });
  }

  // 2. Heavy Precipitation / Flash Flood Potential
  if ((precipitation && precipitation >= 10) || (rain && rain >= 10)) {
    risks.push({
      type: 'PRECIPITATION',
      severity: precipitation >= 25 ? 'CRITICAL' : 'WARNING',
      title: 'HEAVY PRECIPITATION ADVISORY',
      detail: `Current precipitation rate: ${precipitation} mm/h. Low-lying roadways and drainage culverts may experience rapid inundation.`,
      icon: '🌧️',
    });
  }

  // 3. Thunderstorm / Lightning Activity
  if (weatherCode != null && (weatherCode === 95 || weatherCode === 96 || weatherCode === 99)) {
    risks.push({
      type: 'THUNDERSTORM',
      severity: weatherCode >= 96 ? 'CRITICAL' : 'WARNING',
      title: 'ACTIVE THUNDERSTORM / HAIL',
      detail: 'Cloud-to-ground electrical discharge hazard. Seek interior shelter; stay away from open fields, water bodies, and metal masts.',
      icon: '⛈️',
    });
  }

  // 4. Extreme Heat / Heatwave
  if (temperature != null && temperature >= 40) {
    risks.push({
      type: 'HEAT',
      severity: temperature >= 44 ? 'CRITICAL' : 'WARNING',
      title: 'EXTREME AMBIENT HEATWAVE',
      detail: `Recorded temperature: ${temperature}°C. Elevated risk of heat stroke, dehydration, and hyperthermia. Hydrate with ORS and avoid sun exposure.`,
      icon: '🔥',
    });
  } else if (temperature != null && temperature <= 2) {
    // 5. Extreme Cold / Freeze
    risks.push({
      type: 'COLD',
      severity: temperature <= -5 ? 'CRITICAL' : 'WARNING',
      title: 'FREEZING / HYPOTHERMIA RISK',
      detail: `Recorded temperature: ${temperature}°C. Frostbite and hypothermia hazard; layer thermal clothing and safeguard elderly/infants.`,
      icon: '❄️',
    });
  }

  // 6. Low Visibility
  if (visibilityKm != null && visibilityKm <= 1.5) {
    risks.push({
      type: 'VISIBILITY',
      severity: visibilityKm < 0.5 ? 'CRITICAL' : 'WARNING',
      title: 'LOW VISIBILITY HAZARD',
      detail: `Atmospheric visibility reduced to ${visibilityKm} km. Surface vehicular transport and aviation subject to hazardous navigation conditions.`,
      icon: '👁️',
    });
  }

  // 7. Air Quality Hazard
  if (airQuality && airQuality.europeanAqi && airQuality.europeanAqi >= 60) {
    risks.push({
      type: 'AQI',
      severity: airQuality.europeanAqi >= 80 ? 'CRITICAL' : 'WARNING',
      title: 'HAZARDOUS AIR QUALITY',
      detail: `European AQI: ${airQuality.europeanAqi} (${airQuality.severity}). Particulate matter PM2.5: ${airQuality.pm2_5 || 'elevated'} μg/m³. Respiratory protection advised.`,
      icon: '🍃',
    });
  }

  // 8. Active Cyclone Proximity
  if (activeCyclones && activeCyclones.length > 0) {
    const criticalCyclones = activeCyclones.filter((c) => c.alertLevel === 'Red' || c.alertLevel === 'Orange');
    if (criticalCyclones.length > 0) {
      risks.push({
        type: 'CYCLONE',
        severity: 'CRITICAL',
        title: 'ACTIVE TROPICAL CYCLONE ALERT',
        detail: `${criticalCyclones.length} severe tropical storm systems active globally: ${criticalCyclones.map((c) => c.name).join(', ')}. Monitor maritime tracks closely.`,
        icon: '🌀',
      });
    }
  }

  const hasRisks = risks.length > 0;
  const isCritical = risks.some((r) => r.severity === 'CRITICAL');

  return {
    hasRisks,
    risks,
    headline: hasRisks
      ? (isCritical ? 'CRITICAL ATMOSPHERIC HAZARDS DETECTED' : 'ADVISORY ATMOSPHERIC CONDITIONS DETECTED')
      : 'NO SIGNIFICANT WEATHER HAZARD DETECTED',
    badgeClass: hasRisks ? (isCritical ? 'badge-critical' : 'badge-warning') : 'badge-success',
    disclaimer: 'Advisory context — not an official warning.',
  };
}
