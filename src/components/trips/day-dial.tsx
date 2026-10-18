import { useRef } from 'react';
import { Button, ButtonVariant } from '../ui/button';
import { tripDuration } from './trip-itinerary';
import ui from '../ui/ui.module.css';
import styles from './duration-controls.module.css';

const dial = { size: 320, centre: 160, radius: 130, daysPerTurn: 30, ticks: 60 };
const clamp = (value: number) => Math.max(1, Math.min(tripDuration.maxDays, value));
export const dialAngle = (x: number, y: number) =>
  ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
export const dialDelta = (next: number, previous: number) => ((next - previous + 540) % 360) - 180;
interface IDayDialProps {
  value: number;
  onChange: (days: number) => void;
}
interface IDialDrag {
  pointerId: number;
  angle: number;
  position: number;
}
export const DayDial = ({ value, onChange }: IDayDialProps) => {
  const drag = useRef<IDialDrag | null>(null);
  const safeValue = Number.isFinite(value) ? clamp(value) : 1;
  const turn = ((safeValue - 1) % dial.daysPerTurn) / dial.daysPerTurn;
  const radians = turn * Math.PI * 2;
  const circumference = Math.PI * 2 * dial.radius;
  const update = (next: number) => onChange(clamp(Math.round(next)));
  return (
    <div className={styles.dialControl}>
      <div className={styles.dialFace}>
        <svg
          className={styles.dial}
          viewBox={`0 0 ${dial.size} ${dial.size}`}
          role="slider"
          tabIndex={0}
          aria-label="Trip duration dial"
          aria-valuemin={1}
          aria-valuemax={tripDuration.maxDays}
          aria-valuenow={safeValue}
          aria-valuetext={`${safeValue} ${safeValue === 1 ? 'day' : 'days'}. One turn adjusts 30 days.`}
          onKeyDown={(event) => {
            const next = {
              ArrowUp: safeValue + 1,
              ArrowRight: safeValue + 1,
              ArrowDown: safeValue - 1,
              ArrowLeft: safeValue - 1,
              PageUp: safeValue + 7,
              PageDown: safeValue - 7,
              Home: 1,
              End: tripDuration.maxDays,
            };
            if (event.key in next) {
              event.preventDefault();
              const entry = Object.entries(next).find(([key]) => key === event.key);
              if (entry) {
                update(entry[1]);
              }
            }
          }}
          onPointerDown={(event) => {
            if (event.button !== 0) {
              return;
            }
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * dial.size - dial.centre;
            const y = ((event.clientY - rect.top) / rect.height) * dial.size - dial.centre;
            if (Math.hypot(x, y) < 90) {
              return;
            }
            const angle = dialAngle(x, y);
            const position = clamp(
              safeValue + (dialDelta(angle, turn * 360) / 360) * dial.daysPerTurn,
            );
            drag.current = { pointerId: event.pointerId, angle, position };
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.focus();
            update(position);
          }}
          onPointerMove={(event) => {
            const current = drag.current;
            if (!current || current.pointerId !== event.pointerId) {
              return;
            }
            const rect = event.currentTarget.getBoundingClientRect();
            const angle = dialAngle(
              event.clientX - rect.left - rect.width / 2,
              event.clientY - rect.top - rect.height / 2,
            );
            current.position = clamp(
              current.position + (dialDelta(angle, current.angle) / 360) * dial.daysPerTurn,
            );
            current.angle = angle;
            update(current.position);
          }}
          onPointerUp={(event) => {
            drag.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onLostPointerCapture={() => {
            drag.current = null;
          }}
        >
          <g aria-hidden="true">
            {Array.from({ length: dial.ticks }, (_, index) => {
              const angle = (index / dial.ticks) * Math.PI * 2;
              const major = index % 10 === 0;
              const inner = major ? 143 : 147;
              return (
                <line
                  key={index}
                  className={major ? styles.majorTick : styles.tick}
                  x1={160 + Math.sin(angle) * inner}
                  y1={160 - Math.cos(angle) * inner}
                  x2={160 + Math.sin(angle) * 152}
                  y2={160 - Math.cos(angle) * 152}
                />
              );
            })}
            <circle className={styles.track} cx={160} cy={160} r={dial.radius} />
            <circle
              className={styles.arc}
              cx={160}
              cy={160}
              r={dial.radius}
              transform="rotate(-90 160 160)"
              strokeDasharray={`${(turn || (safeValue > 1 ? 1 : 0)) * circumference} ${circumference}`}
            />
            <circle
              className={styles.knob}
              cx={160 + Math.sin(radians) * dial.radius}
              cy={160 - Math.cos(radians) * dial.radius}
              r={14}
            />
          </g>
        </svg>
        <div className={styles.dialNumber}>
          <input
            className={ui.control}
            aria-label="Number of days"
            name="durationDays"
            type="number"
            min={1}
            max={tripDuration.maxDays}
            required
            value={Number.isNaN(value) ? '' : value}
            onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
          />
          <span>{safeValue === 1 ? 'day' : 'days'}</span>
        </div>
        <div className={styles.dialSteps}>
          <Button
            icon
            aria-label="One fewer day"
            disabled={safeValue <= 1}
            onClick={() => update(safeValue - 1)}
          >
            −
          </Button>
          <Button
            icon
            aria-label="One more day"
            disabled={safeValue >= tripDuration.maxDays}
            onClick={() => update(safeValue + 1)}
          >
            ＋
          </Button>
        </div>
      </div>
      <p className={styles.hint}>Drag to adjust</p>
      <div className={styles.presets} aria-label="Trip length presets">
        {[
          { label: 'Weekend', days: 3 },
          { label: 'A week', days: 7 },
          { label: 'Two weeks', days: 14 },
        ].map((preset) => (
          <Button
            key={preset.days}
            variant={value === preset.days ? ButtonVariant.Primary : ButtonVariant.Secondary}
            aria-pressed={value === preset.days}
            onClick={() => onChange(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
