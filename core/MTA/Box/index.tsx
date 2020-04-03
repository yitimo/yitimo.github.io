import React from 'react'
import styles from './index.module.scss'
import { getAnalysis } from '../actions'

export default function MtaBox(props: { active: boolean, onClose: () => void }) {
  const [error, setError] = React.useState('')
  React.useEffect(() => {
    getAnalysis().catch((err) => {
      setError(err.message)
    })
  }, [])
  return (
    <div className={ `${styles.box} ${props.active ? styles.active : ''}` }>
      <img onClick={ props.onClose } className={ styles.close } title="收起" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABaUlEQVRoQ+1Z2w7CIAzFL1e/XNNlmIrQy1oiJd3LsgiHc2HIyq0Ev27B+ZctBTzOVOp9lZC6vNoEoNH9ZPwspawiYsiLEgA6VhCByf9w6r0DZIdmPr3Qs/Z9kvRluYwGZTuexCUkRu8Q11fEgXJNAsCRoBYAqq9k7AObi50DmiGAG/PLFE4ANKYAvQWoyEsSqGpHwJ4C1OQ1AkZJ1P8MLRa0x+JhucZY4uVbMoXwnGtdwr9psbAAjCMmf8W1XhJ1cA8BKvKcgJFDo6XRQwC17HbxqUFTALONdTFIG/sqW+sPjxTw70gygUzA6EBOIaOB5u6ZgNlCI0AmYDTQ3D13o8hC7XScvht1GYCYIy74WtdCfVL2zAv9Ud+r24Qpq4QubIUuLXLlPs/SIlfG7C5o25bXOeerGzMSUCWx3RGT1HnzJkwB0HKCZ6ihHtd2x6x1q4DvCrOmNhUddE9lMAP8ymZuBo/LmOEFvAFRqX4x83h66wAAAABJRU5ErkJggg==" />
      { !!error && <div className={ styles.error }>{ error }</div> }
    </div>
  )
}
