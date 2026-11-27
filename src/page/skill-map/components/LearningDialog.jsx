import { useEffect, useRef } from 'react';
export default function LearningDialog({node,completed,onClose,onComplete}) {
  const ref=useRef(null);
  useEffect(()=>{const dialog=ref.current;if(!dialog.open)dialog.showModal();return ()=>{if(dialog.open)dialog.close();};},[]);
  return <dialog ref={ref} className="learning-dialog" aria-labelledby="dialog-title" onCancel={e=>{e.preventDefault();onClose();}}>
    <p className="dialog-eyebrow">DEMO LEARNING · {node.id}</p><h2 id="dialog-title">{node.title}</h2><p>{node.topic}</p>
    <p>{completed?'此節點已完成，可查看學習範圍。重複開啟不會再次獲得 XP。':'目前尚未串接正式題庫。按下「模擬完成」會直接標記通關，以測試解鎖、XP 與進度；不代表已通過實際能力驗證。'}</p>
    <div className="dialog-actions"><button type="button" className="secondary-action" onClick={onClose}>{completed?'關閉':'稍後繼續'}</button>{!completed&&<button type="button" className="start-learning" onClick={onComplete}>模擬完成 →</button>}</div>
  </dialog>;
}
