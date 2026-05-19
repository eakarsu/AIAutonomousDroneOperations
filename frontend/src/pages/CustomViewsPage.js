import React from 'react';
import LiveDroneMap from '../components/custom-views/LiveDroneMap';
import BatteryStatusGrid from '../components/custom-views/BatteryStatusGrid';
import MissionBriefPDF from '../components/custom-views/MissionBriefPDF';
import GeofenceEditor from '../components/custom-views/GeofenceEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page" style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 26, color: '#e2e8f0' }}>
          <i className="fas fa-helicopter" style={{ marginRight: 8, color: '#38bdf8' }} /> Mission Views
        </h1>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>
          Synthesized operations views: flight path map, per-drone battery/telemetry charts, printable mission briefs, and geofence polygon editor.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
        <LiveDroneMap />
        <BatteryStatusGrid />
        <MissionBriefPDF />
        <GeofenceEditor />
      </div>
    </div>
  );
}
