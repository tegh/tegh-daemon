use async_graphql::*;
use serde::{Deserialize, Serialize};

#[Enum]
#[derive(Debug, Serialize, Deserialize)]
pub enum TaskStatusR1 {
  /* Before sending to the driver */
  Spooled,
  /* After sending to the driver */
  Started,
  Finished,
  Paused,
  Cancelled,
  Errored,
}

type TaskStatus = TaskStatusR1;

impl Default for TaskStatus {
    fn default() -> Self { TaskStatus::Spooled }
}

impl TaskStatus {
    pub fn is_settled(&self) -> bool {
        [
            Self::Cancelled,
            Self::Errored,
            Self::Finished,
        ].contains(self)
    }

    pub fn was_successful(&self) -> bool {
        self == &Self::Finished
    }
}

// export const indexedTaskStatuses = [
//   CANCELLED, // 0
//   PAUSE_TASK, // 1
//   ERROR, // 2
//   START_TASK, // 3
//   FINISH_TASK, // 4
// ]

// export const taskFailureStatuses = [
//   CANCELLED,
//   ERROR,
// ]

// export const endedTaskStatuses = [
//   CANCELLED,
//   ERROR,
//   FINISH_TASK,
// ]

// export const spooledTaskStatuses = [
//   PAUSE_TASK,
//   START_TASK,
//   SPOOLED_TASK,
// ]

// export const busyMachineTaskStatuses = [
//   PAUSE_TASK,
//   START_TASK,
// ]