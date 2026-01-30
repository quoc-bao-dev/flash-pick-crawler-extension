import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  const handleRunOnActiveTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) return

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: () => {
          const targetUrl = "https://shopee.vn/api/v4/flash_sale/get_all_itemids";
          console.log("Đang bắt đầu fetch dữ liệu từ Shopee...");

          fetch(targetUrl, { method: 'GET' })
            .then(response => {
              if (!response.ok) throw new Error('Network response was not ok');
              return response.json();
            })
            .then(data => {
              console.log("Dữ liệu nhận được:", data);
              alert("Đã fetch thành công! Kiểm tra Console (F12) để xem chi tiết.");
            })
            .catch(error => {
              console.error("Lỗi Fetch:", error);
              alert("Lỗi khi fetch: " + error.message);
            });
        }
      })
    } catch (error) {
      console.error('Lỗi khi chạy script trên tab hiện tại:', error)
      alert('Không thể chạy script trên tab hiện tại. Xem chi tiết trong Console.')
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      {/* ==== */}
      <div className="card">
        <button id="runBtn" onClick={handleRunOnActiveTab}>
          Run fetch on active Shopee tab
        </button>
      </div>
    </>
  )
}

export default App
