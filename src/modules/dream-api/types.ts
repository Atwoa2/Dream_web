/**
 * Shapes of the robot backend's /v1 resources.
 *
 * Fields are optional on purpose: the backend evolves separately, and a
 * missing field must degrade to an em dash in the UI, not a crash.
 */

export type Dataset = {
  id?: string;
  name?: string;
  status?: string;
  episodes?: number;
  proprio_dim?: number;
  action_dim?: number;
  cameras?: number | string[];
  created_at?: string;
};

export type Embodiment = {
  id?: string;
  name?: string;
  description?: string;
  proprio_dim?: number;
  action_dim?: number;
  cameras?: number | string[];
};

export type FineTuningJob = {
  id?: string;
  status?: string;
  dataset?: string;
  dataset_id?: string;
  output_model?: string;
  gpu_hours?: number;
  created_at?: string;
};

export type Tank = {
  id?: string;
  name?: string;
  status?: string;
  robot?: string;
  last_seen_at?: string;
};

export type TankRequest = {
  id?: string;
  tank?: string;
  tank_id?: string;
  instruction?: string;
  status?: string;
  created_at?: string;
  result_url?: string;
};
