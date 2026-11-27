import { useEffect, useRef } from "react";
import "./Modal.css";

// 彈窗：用原生 <dialog> 的 showModal()，
// 開啟時焦點會留在彈窗內，後面的頁面無法操作，也不能點背景關閉。
// blocking = true 時連 Esc 都不能關（目前的登入／重設頁不使用此阻擋模式）。
// returnFocusRef：關閉後要把焦點交還給哪個元素（例如送出按鈕）。
function Modal({ open, labelId, blocking = false, onClose, returnFocusRef, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) {
      dialog.close();
      returnFocusRef?.current?.focus();
    }
  }, [open, returnFocusRef]);

  function handleCancel(event) {
    // 按 Esc 時瀏覽器會觸發 cancel：一律攔下，由 React 狀態決定是否關閉
    event.preventDefault();
    if (!blocking) onClose?.();
  }

  function handleNativeClose() {
    // 有些瀏覽器連按兩次 Esc 會略過 cancel 直接關閉：阻擋型彈窗就立刻重新打開
    if (open && blocking) dialogRef.current?.showModal();
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={labelId}
      onCancel={handleCancel}
      onClose={handleNativeClose}
    >
      {open && children}
    </dialog>
  );
}

export default Modal;
