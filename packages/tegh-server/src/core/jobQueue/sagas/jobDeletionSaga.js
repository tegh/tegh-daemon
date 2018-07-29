import { effects } from 'redux-saga'

import fs from '../../util/promisifiedFS'
import { SPOOL_TASK } from '../../spool/actions/spoolTask'
import { ERRORED, CANCELLED, DONE } from '../types/JobStatusEnum'
import getJobsByStatus from '../selectors/getJobsByStatus'
import getJobTmpFiles from '../selectors/getJobTmpFiles'
import deleteJob from '../actions/deleteJob'

/*
 * Deletes the previous job when the next job starts
 */
const jobDeletionSaga = function*() {
  const { takeLatest, select, put, cps } = effects

  const spoolJobFilter = action => {
    return action.type === SPOOL_TASK && action.payload.task.jobID != null
  }

  yield takeLatest(spoolJobFilter, function*() {
    /* get all completed, errored or cancelled jobs */
    const jobsForDeletion = ( yield select( getJobsByStatus ) )({
      statuses: [ERRORED, CANCELLED, DONE]
    })

    const state = yield select()
    for (const job of jobsForDeletion) {
      /* delete the job */
      yield deleteJob({ jobID: job.id })(put, () => state)
    }

    for (const job of jobsForDeletion) {
      /* unlink any tmp files associated with the job */
      const tmpPaths = ( yield select(getJobTmpFiles) )({ jobID: job.id})
      for (const tmpFilePath of tmpPaths) {
        yield cps(fs.unlink, tmpFilePath)
      }
    }
  })
}

export default jobDeletionSaga
