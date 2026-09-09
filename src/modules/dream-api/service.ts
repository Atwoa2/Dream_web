/**
 * Typed reads from the robot backend. Every function returns [] when the
 * backend is not configured or unreachable — pages render an honest empty
 * state instead of crashing.
 */
import { apiGet } from "./client";
import type { Dataset, Embodiment, FineTuningJob, Tank, TankRequest } from "./types";

/** The backend answers either a bare array or { data: [...] } — accept both. */
function items<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const data = (payload as { data?: unknown } | null)?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function listDatasets(): Promise<Dataset[]> {
  return items<Dataset>(await apiGet("/v1/datasets"));
}

export async function listEmbodiments(): Promise<Embodiment[]> {
  return items<Embodiment>(await apiGet("/v1/embodiments"));
}

export async function listFineTuningJobs(): Promise<FineTuningJob[]> {
  return items<FineTuningJob>(await apiGet("/v1/fine_tuning/jobs"));
}

export async function listTanks(): Promise<Tank[]> {
  return items<Tank>(await apiGet("/v1/fish_tank/tanks"));
}

export async function listTankRequests(): Promise<TankRequest[]> {
  return items<TankRequest>(await apiGet("/v1/fish_tank/requests"));
}
