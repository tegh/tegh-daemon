// Part Revison 1 (LATEST)
use chrono::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(new, Debug, Serialize, Deserialize, Clone)]
pub struct Part {
  pub id: u64,
  // Foreign Keys
  pub print_queue_id: u64, // print queues have many (>=0) parts
  pub package_id: u64, // packages have many (>=1) parts
  // Timestamps
  #[new(value = "Utc::now()")]
  pub created_at: DateTime<Utc>,
  // Props
  pub name: String,

  #[new(value = "1")]
  pub quantity: u64,
  #[new(default)]
  pub printed: u64,
  #[new(default)]
  pub printing_task_ids: Vec<u64>,
  pub position: u64,
  pub file_path: String,
}
