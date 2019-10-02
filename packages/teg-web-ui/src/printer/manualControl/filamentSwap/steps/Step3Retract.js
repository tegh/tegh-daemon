import React, { useEffect } from 'react'
import {
  Typography,
  LinearProgress,
} from '@material-ui/core'

import { useTranslation } from 'react-i18next'

import useExecGCodes from '../../../_hooks/useExecGCodes'

import ButtonsFooter from '../ButtonsFooter'

const distance = 100

const Step3Retract = ({
  machine,
  component,
  next,
  classes,
  active,
}) => {
  const { t } = useTranslation('filamentSwap')

  const retractFilament = useExecGCodes(() => ({
    machine,
    gcodes: [
      { moveBy: { distances: { [component.address]: distance }, sync: true } },
    ],
    // Wait for the filament to retract and then go to the next step
    update: next,
  }))

  useEffect(() => {
    if (active) retractFilament()
  }, [active])

  return (
    <React.Fragment>
      <div className={classes.retractRoot}>
        <Typography variant="body1" paragraph>
          {t('retract.title', {
            distance,
            targetTemperature: component.heater.targetTemperature,
          })}
        </Typography>
        <LinearProgress />
      </div>

      <ButtonsFooter disabledNext />
    </React.Fragment>
  )
}

export default Step3Retract