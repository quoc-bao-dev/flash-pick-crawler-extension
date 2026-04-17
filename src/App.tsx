import { useEffect, useState } from 'react';
import './App.css';
import { registerExtension, handshakeExtension, unregisterExtension } from './api/extension.api';

function App() {
  const [isCrawling, setIsCrawling] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentInfo, setAgentInfo] = useState<{ id: string; name: string; status: string } | null>(null);

  useEffect(() => {
    // 1. Initial load from storage
    chrome.storage.local.get(['agentInfo'], (result) => {
      if (result.agentInfo) setAgentInfo(result.agentInfo as any);
    });

    // 2. Listen for storage changes (Source of Truth for Status)
    const storageListener = (changes: any) => {
      if (changes.agentInfo) {
        setAgentInfo(changes.agentInfo.newValue || null);
      }
    };
    chrome.storage.onChanged.addListener(storageListener);

    // 3. Runtime messages (like CRAWL_DONE)
    const messageListener = (request: any) => {
      if (request.action === 'CRAWL_DONE') {
        setIsCrawling(false);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleRegister = async () => {
    if (!agentName) {
      alert('Vui lòng nhập tên Extension (VD: worker-01)');
      return;
    }
    try {
      const resp = await registerExtension(agentName);
      const data = resp?.data || resp;
      setAgentInfo(data);
      chrome.storage.local.set({ agentInfo: data });
      alert('Đăng ký thành công!');
    } catch (error: any) {
      console.error(error);
      alert(`Lỗi đăng ký: ${error?.response?.data?.message || error.message}`);
    }
  };

  const handleHandshake = async () => {
    if (!agentInfo?.id) return;
    try {
      const resp = await handshakeExtension(agentInfo.id);
      const wssUrl = resp?.data?.['wss-url'] || resp['wss-url'];
      console.log('wssUrl', resp);

      if (wssUrl) {
        // Lưu config và báo Background kết nối
        chrome.storage.local.set({ wssUrl });
        chrome.runtime.sendMessage({ action: 'CONNECT_SOCKET' });
        alert(`Bắt tay thành công! Đang yêu cầu Background thiết lập kết nối...`);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Lỗi tái kết nối: ${error?.response?.data?.message || error.message}`);
    }
  };

  const handleUninstall = async () => {
    if (!agentInfo?.name) return;

    const confirm = window.confirm('Bạn có chắc chắn muốn gỡ cài đặt Agent này khỏi hệ thống?');
    if (!confirm) return;

    try {
      await unregisterExtension(agentInfo.name);
      // Báo Background ngắt kết nối
      chrome.runtime.sendMessage({ action: 'DISCONNECT_SOCKET' });

      chrome.storage.local.remove(['agentInfo', 'wssUrl']);
      setAgentInfo(null);
      alert('Đã gỡ cài đặt thành công.');
    } catch (error: any) {
      console.error('Uninstall failed:', error);
      alert(`Lỗi khi gỡ cài đặt: ${error?.response?.data?.message || error.message}`);
    }
  };

  const handleRunOnActiveTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        alert('Không tìm thấy tab active');
        return;
      }

      setIsCrawling(true);
      chrome.runtime.sendMessage({ action: 'RUN_CRAWL', tabId: tab.id }, (response) => {
        console.log('Crawl started:', response);
      });
    } catch (error) {
      console.error('Lỗi khi chạy script trên tab hiện tại:', error);
      alert('Không thể chạy script trên tab hiện tại. Xem chi tiết trong Console.');
      setIsCrawling(false);
    }
  };

  return (
    <>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '300px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>Flash Pick Agent</h1>

        {!agentInfo ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
            <div style={{ fontSize: '13px', color: '#666' }}>Trạng thái: Chưa định danh</div>
            <input
              type="text"
              placeholder="Nhập tên Worker (VD: worker-shopee-01)"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button onClick={handleRegister}>Đăng ký (Register)</button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              textAlign: 'left',
              background: '#f5f5f5',
              padding: '10px',
              borderRadius: '8px',
              color: '#333',
            }}
          >
            <div>
              <strong>Tên Agent:</strong> {agentInfo.name}
            </div>
            <div>
              <strong>Trạng thái:</strong> {agentInfo.status || 'CONNECTED'}
            </div>
            <button onClick={handleHandshake}>Tái kết nối (Handshake)</button>
            <button onClick={handleUninstall} style={{ background: '#ff4d4f', color: '#fff' }}>
              Gỡ cài đặt
            </button>
          </div>
        )}

        <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #ddd', margin: '10px 0' }} />

        <button
          id="runBtn"
          disabled={isCrawling}
          onClick={handleRunOnActiveTab}
          style={{ width: '100%', background: isCrawling ? '#ccc' : '#1890ff', color: '#fff' }}
        >
          {isCrawling ? 'Đang thực thi Crawl...' : '▶ Chạy Crawl'}
        </button>
      </div>
    </>
  );
}

export default App;
