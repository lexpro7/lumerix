import { t } from "../i18n";
import { useRef } from "react";

export type PanelState = "collapsed" | "normal" | "expanded";
const states: PanelState[] = ["collapsed", "normal", "expanded"];
export function stepPanel(state: PanelState, direction: number): PanelState {
  return states[Math.max(0, Math.min(2, states.indexOf(state) + direction))];
}
export function swipePanel(state: PanelState, distance: number, elapsed: number): PanelState {
  if (Math.abs(distance) < 12 || (Math.abs(distance) < 32 && Math.abs(distance) / Math.max(1, elapsed) < 0.45)) return state;
  return stepPanel(state, distance < 0 ? 1 : -1);
}

export default function PanelHandle({ state, onChange }: {
  state: PanelState; onChange: (state: PanelState) => void;
}) {
  const gesture = useRef<{ y: number; time: number; state: PanelState } | null>(null);
  const suppressClick = useRef(false);
  return <button
    className="panel-handle"
    aria-label={t(`Editing panel: ${state}. Swipe up or down, or use arrow keys to resize.`)}
    aria-expanded={state !== "collapsed"}
    onPointerDown={e => {
      if (!e.isPrimary || e.button !== 0) return;
      suppressClick.current = false;
      gesture.current = { y: e.clientY, time: e.timeStamp, state };
      e.currentTarget.setPointerCapture(e.pointerId);
    }}
    onPointerUp={e => {
      const start = gesture.current;
      gesture.current = null;
      if (!start) return;
      suppressClick.current = Math.abs(e.clientY - start.y) >= 12;
      onChange(swipePanel(start.state, e.clientY - start.y, e.timeStamp - start.time));
      e.currentTarget.releasePointerCapture(e.pointerId);
    }}
    onPointerCancel={() => { gesture.current = null; suppressClick.current = true; }}
    onLostPointerCapture={() => { gesture.current = null; }}
    onClick={() => {
      if (suppressClick.current) { suppressClick.current = false; return; }
      onChange(state === "expanded" ? "normal" : stepPanel(state, 1));
    }}
    onKeyDown={e => {
      if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      onChange(e.key === "Home" ? "collapsed" : e.key === "End" ? "expanded" : stepPanel(state, e.key === "ArrowUp" ? 1 : -1));
    }}
  ><span aria-hidden="true" /></button>;
}
