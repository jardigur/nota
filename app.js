// State Aplikasi Kasir
let state = {
  store: {
    name: 'MANGROVE GEJAYAN',
    address: 'JALAN BOUGENVILE CTX 2',
    phone: 'YOGYAKARTA (0274)6411510'
  },
  operator: '',
  cashier: '',
  customer: {
    name: '',
    phone: ''
  },
  order: {
    no: '',
    datetime: '',
    deadline: ''
  },
  items: [
    {
      id: 1,
      category: '',
      name: '',
      variant: '',
      qty: 1,
      price: 0
    }
  ],
  payment: {
    finishing: 0,
    discount: 0,
    paid: 0,
    status: 'L U N A S'
  },
  notes: `1.Cek kembali file anda dan
  pastikan tidak ada yang salah.
  Kesalahan file setelah transaksi
  bukan menjadi tanggung jawab kami
2.Barang yang tidak diambil lebih dari
  7 hari apabila hilang/rusak bukan
  menjadi tanggung jawab kami`,
  slogan: '-- TERIMA KASIH --',
  website: 'www.mangroveprinting.com',
  paperSize: '58mm',
  printFontSize: 7, // Ukuran font cetak default 7pt (standar 58mm)
  selectedPrinter: 'CUTTER',
  autoCut: true,
  directPrintAvailable: false,
  printMode: 'system' // 'system' | 'serial' | 'usb' | 'bluetooth'
};

// Format Angka ke Ribuan dengan koma (contoh: 4,700)
function formatNum(num) {
  const n = Math.round(Number(num) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Inisialisasi DOM setelah halaman termuat
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  bindInputEvents();
  renderItemsTable();
  updateReceipt();
  setupPaperSelector();
  setupFontCalibration();
  initPrinterSystem();
});

// Setup Pemilih Ukuran Kertas
function setupPaperSelector() {
  const radios = document.querySelectorAll('input[name="paper-size"]');
  const container = document.getElementById('thermal-container');
  
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.paperSize = e.target.value;
      if (state.paperSize === '80mm') {
        container.classList.remove('width-58mm');
        container.classList.add('width-80mm');
        document.body.classList.remove('print-58mm');
        document.body.classList.add('print-80mm');
        state.printFontSize = 9.5;
      } else {
        container.classList.remove('width-80mm');
        container.classList.add('width-58mm');
        document.body.classList.remove('print-80mm');
        document.body.classList.add('print-58mm');
        state.printFontSize = 7;
      }
      applyFontCalibration();
      updateReceipt();
      saveToStorage();
    });
  });

  // Default
  if (state.paperSize === '80mm') {
    container.classList.remove('width-58mm');
    container.classList.add('width-80mm');
    document.body.classList.remove('print-58mm');
    document.body.classList.add('print-80mm');
  } else {
    container.classList.remove('width-80mm');
    container.classList.add('width-58mm');
    document.body.classList.remove('print-80mm');
    document.body.classList.add('print-58mm');
  }
}

// Setup Kalibrasi Font Cetak Printer Thermal
function setupFontCalibration() {
  const btnDec = document.getElementById('btn-font-dec');
  const btnInc = document.getElementById('btn-font-inc');
  const btnReset = document.getElementById('btn-font-reset');

  if (btnDec) {
    btnDec.addEventListener('click', () => {
      if (state.printFontSize > 5) {
        state.printFontSize = Math.round((state.printFontSize - 0.5) * 10) / 10;
        applyFontCalibration();
        saveToStorage();
        showToast(`Ukuran font cetak: ${state.printFontSize} pt`);
      }
    });
  }

  if (btnInc) {
    btnInc.addEventListener('click', () => {
      if (state.printFontSize < 13) {
        state.printFontSize = Math.round((state.printFontSize + 0.5) * 10) / 10;
        applyFontCalibration();
        saveToStorage();
        showToast(`Ukuran font cetak: ${state.printFontSize} pt`);
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      state.printFontSize = state.paperSize === '80mm' ? 9.5 : 7;
      applyFontCalibration();
      saveToStorage();
      showToast(`Font cetak direset ke ${state.printFontSize} pt`);
    });
  }

  applyFontCalibration();
}

// Terapkan Ukuran Font ke CSS Variable dan Label
function applyFontCalibration() {
  const fontPt = state.printFontSize || (state.paperSize === '80mm' ? 9.5 : 7);
  document.documentElement.style.setProperty('--print-font-size', `${fontPt}pt`);
  
  const label = document.getElementById('print-font-label');
  if (label) {
    label.textContent = `${fontPt} pt (${state.paperSize === '80mm' ? '80mm' : 'Pas 58mm'})`;
  }
}

// Hubungkan Input Form dengan State
function bindInputEvents() {
  const bind = (id, obj, prop) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      obj[prop] = el.value;
      updateReceipt();
      saveToStorage();
    });
  };

  const bindNum = (id, obj, prop) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      obj[prop] = parseFloat(el.value) || 0;
      updateReceipt();
      saveToStorage();
    });
  };

  bind('store-name', state.store, 'name');
  bind('store-address', state.store, 'address');
  bind('store-phone', state.store, 'phone');
  bind('operator-name', state, 'operator');
  bind('cashier-name', state, 'cashier');
  bind('customer-name', state.customer, 'name');
  bind('customer-phone', state.customer, 'phone');
  bind('order-no', state.order, 'no');
  bind('order-datetime', state.order, 'datetime');
  bind('order-deadline', state.order, 'deadline');

  bindNum('cost-finishing', state.payment, 'finishing');
  bindNum('cost-discount', state.payment, 'discount');
  bindNum('amount-paid', state.payment, 'paid');
  
  const statusEl = document.getElementById('payment-status');
  if (statusEl) {
    statusEl.addEventListener('change', () => {
      state.payment.status = statusEl.value;
      updateReceipt();
      saveToStorage();
    });
  }

  const notesEl = document.getElementById('receipt-notes');
  if (notesEl) {
    notesEl.addEventListener('input', () => {
      state.notes = notesEl.value;
      updateReceipt();
      saveToStorage();
    });
  }

  bind('receipt-slogan', state, 'slogan');
  bind('receipt-website', state, 'website');

  // Tombol Tambah Barang
  document.getElementById('btn-add-item').addEventListener('click', () => {
    addItem();
  });

  // Tombol Waktu Sekarang
  document.getElementById('btn-now').addEventListener('click', () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const d = pad(now.getDate());
    const m = pad(now.getMonth() + 1);
    const y = now.getFullYear();
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const str = `${d}-${m}-${y} / ${hh}:${mm}`;
    document.getElementById('order-datetime').value = str;
    state.order.datetime = str;
    updateReceipt();
    saveToStorage();
    showToast('Waktu berhasil diperbarui ke saat ini');
  });

  // Tombol Generate No Order
  document.getElementById('btn-gen-order').addEventListener('click', () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const romanMonths = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
    const now = new Date();
    const month = romanMonths[now.getMonth()];
    const year = String(now.getFullYear()).slice(-2);
    const no = `${rand}/MR/${month}/${year}`;
    document.getElementById('order-no').value = no;
    state.order.no = no;
    updateReceipt();
    saveToStorage();
    showToast(`No. Order di-generate: ${no}`);
  });

  // Tombol Reset Transaksi Baru
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Mulai transaksi baru? Formulir pesanan dan barang akan dikosongkan.')) {
      state.customer = { name: '', phone: '' };
      state.items = [
        { id: Date.now(), category: '', name: '', variant: '', qty: 1, price: 0 }
      ];
      state.payment = {
        finishing: 0,
        discount: 0,
        paid: 0,
        status: 'L U N A S'
      };
      
      // Auto time & new order
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      state.order.datetime = `${pad(now.getDate())}-${pad(now.getMonth()+1)}-${now.getFullYear()} / ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      state.order.deadline = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const romanMonths = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
      state.order.no = `${Math.floor(1000 + Math.random() * 9000)}/MR/${romanMonths[now.getMonth()]}/${String(now.getFullYear()).slice(-2)}`;

      syncStateToForm();
      renderItemsTable();
      updateReceipt();
      saveToStorage();
      showToast('Form transaksi baru telah siap');
    }
  });

  // Tombol Salin Markdown
  document.getElementById('btn-copy-md').addEventListener('click', () => {
    const md = generateMarkdownReceipt();
    navigator.clipboard.writeText(md).then(() => {
      showToast('✅ Teks format Markdown berhasil disalin ke clipboard!');
    }).catch(() => {
      showToast('Gagal menyalin. Silakan coba lagi.');
    });
  });

  // Tombol Print (Header & Panel Kanan)
  const triggerPrint = () => {
    triggerThermalPrint();
  };

  document.getElementById('btn-print').addEventListener('click', triggerPrint);
  document.getElementById('btn-print-2').addEventListener('click', triggerPrint);
}

// ====================================================================
// PRINTER ENGINE (DIALOG SISTEM WINDOWS, WEB SERIAL, WEB USB, BLUETOOTH)
// ====================================================================

let activeSerialPort = null;
let activeUsbDevice = null;
let activeUsbEndpoint = null;
let activeBtDevice = null;
let activeBtCharacteristic = null;
let activeDeviceType = null; // 'serial' | 'usb' | 'bluetooth' | 'bridge' | null

// Inisialisasi sistem printer multi-mode
function initPrinterSystem() {
  const modeSelect = document.getElementById('printer-mode-select');
  const btnConnect = document.getElementById('btn-connect-device');
  const btnDisconnect = document.getElementById('btn-disconnect-device');
  const btnTestPrint = document.getElementById('btn-test-print');
  const btnBrowserPrint = document.getElementById('btn-browser-print');
  const checkAutoCut = document.getElementById('check-auto-cut');

  if (modeSelect) {
    modeSelect.value = state.printMode || 'system';
    modeSelect.addEventListener('change', (e) => {
      state.printMode = e.target.value;
      saveToStorage();
      updatePrinterUI();
      showToast(`Opsi printer: ${getModeLabel(state.printMode)}`);
    });
  }

  if (checkAutoCut) {
    checkAutoCut.checked = state.autoCut !== false;
    checkAutoCut.addEventListener('change', (e) => {
      state.autoCut = e.target.checked;
      saveToStorage();
    });
  }

  if (btnConnect) {
    btnConnect.addEventListener('click', async () => {
      await requestUserConnectDevice();
    });
  }

  if (btnDisconnect) {
    btnDisconnect.addEventListener('click', async () => {
      await disconnectPrinterDevice();
    });
  }

  if (btnTestPrint) {
    btnTestPrint.addEventListener('click', async () => {
      await sendTestPrint();
    });
  }

  if (btnBrowserPrint) {
    btnBrowserPrint.addEventListener('click', () => {
      printViaBrowserDialog();
    });
  }

  // Coba reconnect otomatis jika sebelumnya pernah diizinkan
  tryAutoReconnectPrinter();

  // Dengarkan event disconnect printer fisik
  if ('serial' in navigator) {
    navigator.serial.addEventListener('disconnect', () => {
      activeSerialPort = null;
      if (activeDeviceType === 'serial') activeDeviceType = null;
      updatePrinterUI();
      showToast('⚠️ Kabel printer Serial terputus.');
    });
  }
  if ('usb' in navigator) {
    navigator.usb.addEventListener('disconnect', () => {
      activeUsbDevice = null;
      activeUsbEndpoint = null;
      if (activeDeviceType === 'usb') activeDeviceType = null;
      updatePrinterUI();
      showToast('⚠️ Kabel printer USB terputus.');
    });
  }

  updatePrinterUI();
}

// Label ringkas per mode
function getModeLabel(mode) {
  switch (mode) {
    case 'system': return 'Dialog Printer Windows (Semua Printer)';
    case 'serial': return 'Direct Web Serial (Port COM)';
    case 'usb': return 'Direct WebUSB';
    case 'bluetooth': return 'Direct Web Bluetooth';
    default: return mode;
  }
}

// Router tombol sambungkan perangkat
async function requestUserConnectDevice() {
  if (state.printMode === 'serial') {
    await requestConnectSerial();
  } else if (state.printMode === 'usb') {
    await requestConnectUsb();
  } else if (state.printMode === 'bluetooth') {
    await requestConnectBluetooth();
  } else {
    showToast('Mode Dialog Sistem langsung siap digunakan tanpa pairing.');
  }
}

// Hubungkan Web Serial (COM Port)
async function requestConnectSerial() {
  if (!('serial' in navigator)) {
    alert('Browser Anda belum mendukung Web Serial API. Mohon gunakan Google Chrome atau Microsoft Edge terbaru.');
    return;
  }
  try {
    const port = await navigator.serial.requestPort();
    await openSerialPort(port);
    showToast('✅ Printer Thermal berhasil tersambung via Web Serial (Port COM)!');
    updatePrinterUI();
  } catch (err) {
    if (err.name === 'NotFoundError') return; // User membatalkan prompt
    console.error('Web Serial error:', err);
    showToast('Gagal menyambungkan Serial: ' + err.message);
  }
}

// Hubungkan WebUSB Direct
async function requestConnectUsb() {
  if (!('usb' in navigator)) {
    alert('Browser Anda belum mendukung WebUSB API. Mohon gunakan Google Chrome atau Microsoft Edge terbaru.');
    return;
  }
  try {
    const device = await navigator.usb.requestDevice({ filters: [] });
    await openUsbDevice(device);
    showToast('✅ Printer Thermal berhasil tersambung via WebUSB Direct!');
    updatePrinterUI();
  } catch (err) {
    if (err.name === 'NotFoundError') return;
    console.error('WebUSB error:', err);
    showToast('Gagal menyambungkan USB: ' + err.message);
  }
}

// Hubungkan Web Bluetooth (Printer Kasir Portable)
async function requestConnectBluetooth() {
  if (!('bluetooth' in navigator)) {
    alert('Browser Anda belum mendukung Web Bluetooth API. Mohon gunakan Google Chrome atau Microsoft Edge terbaru pada komputer yang memiliki Bluetooth.');
    return;
  }
  try {
    showToast('Mencari printer thermal Bluetooth...');
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // ESC/POS standard
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '0000ae00-0000-1000-8000-00805f9b34fb',
        '0000af30-0000-1000-8000-00805f9b34fb'
      ]
    });

    showToast(`Menghubungkan ke ${device.name || 'Printer Bluetooth'}...`);
    const server = await device.gatt.connect();

    // Cari characteristic yang mendukung penulisan (write / writeWithoutResponse)
    let foundChar = null;
    const services = await server.getPrimaryServices();
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          foundChar = char;
          break;
        }
      }
      if (foundChar) break;
    }

    if (!foundChar) {
      throw new Error('Tidak ditemukan kanal tulis (writable characteristic) pada perangkat Bluetooth ini.');
    }

    activeBtDevice = device;
    activeBtCharacteristic = foundChar;
    activeDeviceType = 'bluetooth';
    localStorage.setItem('mangrove_printer_connected', 'bluetooth');

    device.addEventListener('gattserverdisconnected', () => {
      activeBtDevice = null;
      activeBtCharacteristic = null;
      if (activeDeviceType === 'bluetooth') activeDeviceType = null;
      updatePrinterUI();
      showToast('⚠️ Sambungan printer Bluetooth terputus.');
    });

    updatePrinterUI();
    showToast(`✅ Berhasil terhubung ke ${device.name || 'Printer Bluetooth'}!`);
  } catch (err) {
    if (err.name === 'NotFoundError') return;
    console.error('Bluetooth error:', err);
    showToast('Gagal Bluetooth: ' + err.message);
  }
}

// Buka Serial Port (Baud rate thermal standar 9600)
async function openSerialPort(port) {
  try {
    if (!port.readable || !port.writable) {
      await port.open({ baudRate: 9600 });
    }
    activeSerialPort = port;
    activeDeviceType = 'serial';
    localStorage.setItem('mangrove_printer_connected', 'serial');
  } catch (e) {
    console.error('Failed to open serial port', e);
    throw e;
  }
}

// Buka USB Device
async function openUsbDevice(device) {
  try {
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    let ifaceNum = 0;
    let epOut = 1;
    const ifaces = device.configuration.interfaces;
    for (const iface of ifaces) {
      for (const alt of iface.alternates) {
        for (const ep of alt.endpoints) {
          if (ep.direction === 'out') {
            ifaceNum = iface.interfaceNumber;
            epOut = ep.endpointNumber;
            break;
          }
        }
      }
    }
    await device.claimInterface(ifaceNum);
    activeUsbDevice = device;
    activeUsbEndpoint = epOut;
    activeDeviceType = 'usb';
    localStorage.setItem('mangrove_printer_connected', 'usb');
  } catch (e) {
    console.error('Failed to open USB device', e);
    throw e;
  }
}

// Coba auto-reconnect tanpa memunculkan prompt dialog
async function tryAutoReconnectPrinter() {
  const savedType = localStorage.getItem('mangrove_printer_connected');

  if (savedType === 'serial' && 'serial' in navigator) {
    try {
      const ports = await navigator.serial.getPorts();
      if (ports.length > 0) {
        await openSerialPort(ports[0]);
        updatePrinterUI();
        return;
      }
    } catch (e) {
      console.warn('Auto reconnect serial error', e);
    }
  }

  if (savedType === 'usb' && 'usb' in navigator) {
    try {
      const devices = await navigator.usb.getDevices();
      if (devices.length > 0) {
        await openUsbDevice(devices[0]);
        updatePrinterUI();
        return;
      }
    } catch (e) {
      console.warn('Auto reconnect USB error', e);
    }
  }

  // Cek jika local bridge (port 9123) sedang aktif
  checkLocalBridgeSilent();
}

// Cek Local Bridge sebagai alternatif
async function checkLocalBridgeSilent() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch('http://127.0.0.1:9123/status', { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      activeDeviceType = 'bridge';
      state.selectedPrinter = data.defaultPrinter || 'CUTTER';
      updatePrinterUI();
      return;
    }
  } catch (e) {}

  updatePrinterUI();
}

// Putuskan sambungan printer perangkat direct
async function disconnectPrinterDevice() {
  if (activeSerialPort) {
    try { await activeSerialPort.close(); } catch (e) {}
    activeSerialPort = null;
  }
  if (activeUsbDevice) {
    try { await activeUsbDevice.close(); } catch (e) {}
    activeUsbDevice = null;
    activeUsbEndpoint = null;
  }
  if (activeBtDevice && activeBtDevice.gatt.connected) {
    try { activeBtDevice.gatt.disconnect(); } catch (e) {}
    activeBtDevice = null;
    activeBtCharacteristic = null;
  }
  activeDeviceType = null;
  localStorage.removeItem('mangrove_printer_connected');
  updatePrinterUI();
  showToast('Sambungan perangkat printer telah diputuskan.');
}

// Update tampilan UI printer berdasarkan mode & status koneksi
function updatePrinterUI() {
  const dot = document.getElementById('print-status-dot');
  const text = document.getElementById('print-status-text');
  const badge = document.getElementById('print-mode-badge');
  const modeSelect = document.getElementById('printer-mode-select');
  const systemHint = document.getElementById('printer-system-hint');
  const directControls = document.getElementById('printer-direct-controls');
  const promptView = document.getElementById('printer-connect-prompt');
  const infoView = document.getElementById('printer-connected-info');
  const btnConnect = document.getElementById('btn-connect-device');
  const deviceName = document.getElementById('connected-device-name');
  const labelAutoCut = document.getElementById('label-auto-cut');
  const guideTitle = document.getElementById('print-guide-title-text');
  const guideList = document.getElementById('print-guide-list');

  const currentMode = state.printMode || 'system';
  if (modeSelect && modeSelect.value !== currentMode) {
    modeSelect.value = currentMode;
  }

  if (currentMode === 'system') {
    // Mode Dialog Sistem Windows (Default & Paling Stabil)
    if (dot) dot.className = 'status-indicator online';
    if (text) text.textContent = 'Siap Cetak (Pilih di Dialog Cetak)';
    if (badge) badge.textContent = 'DIALOG SISTEM';
    if (systemHint) systemHint.style.display = 'block';
    if (directControls) directControls.style.display = 'none';
    if (labelAutoCut) labelAutoCut.style.display = 'none';

    if (guideTitle) guideTitle.textContent = '💡 Petunjuk Pemilihan Device & Cetak Struk:';
    if (guideList) {
      guideList.innerHTML = `
        <li><strong>Pilih Printer Kasir Anda:</strong> Saat jendela cetak muncul, pada kolom <em>Destination / Tujuan</em>, pilih nama printer thermal Anda (misal POS-58, POS-80, Epson, atau Microsoft Print to PDF).</li>
        <li><strong>Atur Margin:</strong> Pastikan opsi margin disetel ke <em>None / Tanpa Margin</em> agar cetakan pas di kertas thermal.</li>
        <li><strong>Tersimpan Otomatis:</strong> Browser akan otomatis mengingat printer yang Anda pilih untuk transaksi-transaksi berikutnya.</li>
      `;
    }
  } else if (currentMode === 'serial') {
    // Mode Web Serial
    if (systemHint) systemHint.style.display = 'none';
    if (directControls) directControls.style.display = 'block';
    if (labelAutoCut) labelAutoCut.style.display = 'flex';
    if (btnConnect) btnConnect.innerHTML = '🔌 Pilih & Sambungkan Port COM / Serial';

    const isConnected = activeSerialPort && activeSerialPort.readable;
    if (isConnected) {
      if (dot) dot.className = 'status-indicator online';
      if (text) text.textContent = '🟢 Port Serial/COM Terhubung';
      if (badge) badge.textContent = 'WEB SERIAL';
      if (promptView) promptView.style.display = 'none';
      if (infoView) infoView.style.display = 'block';
      if (deviceName) deviceName.textContent = '🟢 Port Serial/COM Siap';
    } else {
      if (dot) dot.className = 'status-indicator offline';
      if (text) text.textContent = 'Port Serial/COM belum dipilih';
      if (badge) badge.textContent = 'SERIAL COM';
      if (promptView) promptView.style.display = 'block';
      if (infoView) infoView.style.display = 'none';
    }

    if (guideTitle) guideTitle.textContent = '⚡ Petunjuk Direct Web Serial (COM Port):';
    if (guideList) {
      guideList.innerHTML = `
        <li><strong>Sambungkan Port:</strong> Klik tombol <em>🔌 Pilih & Sambungkan Port COM / Serial</em> di atas.</li>
        <li><strong>Pilih Port:</strong> Pilih port printer thermal Anda pada pop-up browser lalu klik Hubungkan.</li>
        <li><strong>Cetak Instan:</strong> Struk akan langsung keluar tanpa pop-up dialog print.</li>
      `;
    }
  } else if (currentMode === 'usb') {
    // Mode WebUSB Direct
    if (systemHint) systemHint.style.display = 'none';
    if (directControls) directControls.style.display = 'block';
    if (labelAutoCut) labelAutoCut.style.display = 'flex';
    if (btnConnect) btnConnect.innerHTML = '⚡ Pilih & Sambungkan Printer USB Direct';

    const isConnected = activeUsbDevice && activeUsbDevice.opened;
    if (isConnected) {
      if (dot) dot.className = 'status-indicator online';
      if (text) text.textContent = `🟢 USB: ${activeUsbDevice.productName || 'Thermal Printer'}`;
      if (badge) badge.textContent = 'WEB USB';
      if (promptView) promptView.style.display = 'none';
      if (infoView) infoView.style.display = 'block';
      if (deviceName) deviceName.textContent = `🟢 ${activeUsbDevice.productName || 'Printer USB'}`;
    } else {
      if (dot) dot.className = 'status-indicator offline';
      if (text) text.textContent = 'Printer USB belum terhubung';
      if (badge) badge.textContent = 'RAW USB';
      if (promptView) promptView.style.display = 'block';
      if (infoView) infoView.style.display = 'none';
    }

    if (guideTitle) guideTitle.textContent = '⚡ Petunjuk Direct WebUSB:';
    if (guideList) {
      guideList.innerHTML = `
        <li><strong>Catatan Windows:</strong> Di Windows, printer yang memakai driver bawaan pabrik sering dikunci oleh Windows spooler. Jika WebUSB tidak dapat dibuka, gunakan mode <em>Dialog Printer Windows</em>.</li>
        <li><strong>Sambungkan:</strong> Klik tombol <em>⚡ Pilih & Sambungkan Printer USB Direct</em>.</li>
      `;
    }
  } else if (currentMode === 'bluetooth') {
    // Mode Web Bluetooth
    if (systemHint) systemHint.style.display = 'none';
    if (directControls) directControls.style.display = 'block';
    if (labelAutoCut) labelAutoCut.style.display = 'flex';
    if (btnConnect) btnConnect.innerHTML = '📶 Cari & Pasangkan Printer Bluetooth';

    const isConnected = activeBtDevice && activeBtCharacteristic;
    if (isConnected) {
      if (dot) dot.className = 'status-indicator online';
      if (text) text.textContent = `🟢 BT: ${activeBtDevice.name || 'Printer Kasir'}`;
      if (badge) badge.textContent = 'BLUETOOTH';
      if (promptView) promptView.style.display = 'none';
      if (infoView) infoView.style.display = 'block';
      if (deviceName) deviceName.textContent = `🟢 ${activeBtDevice.name || 'Bluetooth Printer'}`;
    } else {
      if (dot) dot.className = 'status-indicator offline';
      if (text) text.textContent = 'Printer Bluetooth belum terhubung';
      if (badge) badge.textContent = 'BLUETOOTH';
      if (promptView) promptView.style.display = 'block';
      if (infoView) infoView.style.display = 'none';
    }

    if (guideTitle) guideTitle.textContent = '📶 Petunjuk Direct Web Bluetooth:';
    if (guideList) {
      guideList.innerHTML = `
        <li><strong>Nyalakan Printer:</strong> Pastikan printer thermal portable Bluetooth dalam kondisi menyala.</li>
        <li><strong>Pasangkan:</strong> Klik tombol <em>📶 Cari & Pasangkan Printer Bluetooth</em>, lalu pilih nama printer Anda (misal RPP02N, ZJiang, Bluetooth POS).</li>
        <li><strong>Cetak Nirkabel:</strong> Struk dicetak secara langsung via Bluetooth tanpa kabel.</li>
      `;
    }
  }
}

// Buat Binary Array ESC/POS untuk Printer Thermal
function buildEscPosBytes(text, doCut = true) {
  // ESC @ (Inisialisasi printer)
  const initBytes = [0x1b, 0x40];
  
  // Konversi teks ke byte ANSI/Latin-1 (kompatibel penuh dengan thermal ESC/POS)
  const textBytes = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    textBytes.push(code < 256 ? code : 63); // 63 adalah '?'
  }

  // Baris kosong sebelum pemotong kertas
  const feedBytes = [0x0d, 0x0a, 0x0d, 0x0a, 0x0d, 0x0a, 0x0d, 0x0a];

  // ESC/POS GS V 66 0 (Potong kertas jika didukung)
  const cutBytes = doCut ? [0x1d, 0x56, 0x42, 0x00] : [];

  const combined = new Uint8Array(initBytes.concat(textBytes, feedBytes, cutBytes));
  return combined;
}

// Kirim data langsung ke hardware printer (Serial / USB)
async function sendRawBytesToPrinter(bytes) {
  if (state.printMode === 'serial' && activeSerialPort && activeSerialPort.writable) {
    const writer = activeSerialPort.writable.getWriter();
    await writer.write(bytes);
    writer.releaseLock();
    return true;
  }

  if (state.printMode === 'usb' && activeUsbDevice && activeUsbDevice.opened) {
    await activeUsbDevice.transferOut(activeUsbEndpoint, bytes);
    return true;
  }

  return false;
}

// Kirim data ke printer via Bluetooth GATT characteristic
async function sendBytesToBluetooth(bytes) {
  if (!activeBtCharacteristic) return false;
  const chunkSize = 100; // Paket aman BLE MTU untuk thermal printer
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    if (activeBtCharacteristic.writeValueWithoutResponse) {
      await activeBtCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await activeBtCharacteristic.writeValue(chunk);
    }
    await new Promise(r => setTimeout(r, 25));
  }
  return true;
}

// Trigger Print Utama (Menyesuaikan dengan Opsi Printer yang Dipilih Pengguna)
async function triggerThermalPrint() {
  const currentMode = state.printMode || 'system';

  // 1. Mode Dialog Printer Windows (Metode Utama & Paling Stabil)
  if (currentMode === 'system') {
    printViaBrowserDialog();
    return;
  }

  const receiptText = generateMonospaceReceipt();

  // 2. Mode Web Serial
  if (currentMode === 'serial') {
    if (activeSerialPort && activeSerialPort.writable) {
      try {
        showToast('⚡ Mencetak via Web Serial (Port COM)...');
        const bytes = buildEscPosBytes(receiptText, state.autoCut !== false);
        await sendRawBytesToPrinter(bytes);
        showToast('✅ Struk berhasil dicetak ke Printer Serial!');
        return;
      } catch (e) {
        console.error('Serial print error:', e);
        showToast('⚠️ Gagal Serial: ' + e.message);
      }
    } else {
      if (confirm('Port Serial/COM belum terhubung.\n\nKlik "OK" untuk memilih port COM sekarang,\natau klik "Batal" untuk mencetak lewat Dialog Printer Windows.')) {
        await requestConnectSerial();
        if (activeSerialPort && activeSerialPort.writable) {
          triggerThermalPrint();
        }
      } else {
        printViaBrowserDialog();
      }
      return;
    }
  }

  // 3. Mode WebUSB Direct
  if (currentMode === 'usb') {
    if (activeUsbDevice && activeUsbDevice.opened) {
      try {
        showToast('⚡ Mencetak via WebUSB Direct...');
        const bytes = buildEscPosBytes(receiptText, state.autoCut !== false);
        await sendRawBytesToPrinter(bytes);
        showToast('✅ Struk berhasil dicetak ke Printer USB!');
        return;
      } catch (e) {
        console.error('USB print error:', e);
        showToast('⚠️ Gagal USB: ' + e.message);
      }
    } else {
      if (confirm('Printer USB belum terhubung via WebUSB.\n\nKlik "OK" untuk memilih perangkat USB sekarang,\natau klik "Batal" untuk mencetak lewat Dialog Printer Windows.')) {
        await requestConnectUsb();
        if (activeUsbDevice && activeUsbDevice.opened) {
          triggerThermalPrint();
        }
      } else {
        printViaBrowserDialog();
      }
      return;
    }
  }

  // 4. Mode Web Bluetooth
  if (currentMode === 'bluetooth') {
    if (activeBtCharacteristic) {
      try {
        showToast('📶 Mencetak via Bluetooth...');
        const bytes = buildEscPosBytes(receiptText, state.autoCut !== false);
        await sendBytesToBluetooth(bytes);
        showToast('✅ Struk berhasil dicetak ke Printer Bluetooth!');
        return;
      } catch (e) {
        console.error('Bluetooth print error:', e);
        showToast('⚠️ Gagal Bluetooth: ' + e.message);
      }
    } else {
      if (confirm('Printer Bluetooth belum terhubung.\n\nKlik "OK" untuk mencari & memasangkan printer Bluetooth sekarang,\natau klik "Batal" untuk mencetak lewat Dialog Printer Windows.')) {
        await requestConnectBluetooth();
        if (activeBtCharacteristic) {
          triggerThermalPrint();
        }
      } else {
        printViaBrowserDialog();
      }
      return;
    }
  }

  // 5. Fallback ke Dialog Sistem
  printViaBrowserDialog();
}

// Kirim Tes Cetak ke Printer
async function sendTestPrint() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = `${pad(now.getDate())}-${pad(now.getMonth()+1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const currentMode = state.printMode || 'system';
  const testText = [
    '====================================',
    '       TES PRINTER THERMAL',
    '        MANGROVE PRINTING',
    '====================================',
    ` Mode    : ${getModeLabel(currentMode)}`,
    ` Waktu   : ${timeStr}`,
    ` Ukuran  : ${state.paperSize || '58mm'}`,
    ' Status  : PRINTER SIAP DIGUNAKAN!',
    '------------------------------------',
    '       -- TERIMA KASIH --',
    '===================================='
  ].join('\r\n');

  if (currentMode === 'system') {
    showToast('Membuka jendela cetak untuk tes printer...');
    printViaBrowserDialog(testText);
    return;
  }

  if (currentMode === 'serial') {
    if (activeSerialPort && activeSerialPort.writable) {
      try {
        showToast('⚡ Mengirim tes cetak ke port Serial...');
        const bytes = buildEscPosBytes(testText, state.autoCut !== false);
        await sendRawBytesToPrinter(bytes);
        showToast('✅ Tes cetak Serial berhasil!');
      } catch (e) {
        showToast('❌ Gagal: ' + e.message);
      }
    } else {
      showToast('⚠️ Hubungkan port Serial terlebih dahulu.');
      await requestConnectSerial();
    }
    return;
  }

  if (currentMode === 'usb') {
    if (activeUsbDevice && activeUsbDevice.opened) {
      try {
        showToast('⚡ Mengirim tes cetak ke USB...');
        const bytes = buildEscPosBytes(testText, state.autoCut !== false);
        await sendRawBytesToPrinter(bytes);
        showToast('✅ Tes cetak USB berhasil!');
      } catch (e) {
        showToast('❌ Gagal: ' + e.message);
      }
    } else {
      showToast('⚠️ Hubungkan printer USB terlebih dahulu.');
      await requestConnectUsb();
    }
    return;
  }

  if (currentMode === 'bluetooth') {
    if (activeBtCharacteristic) {
      try {
        showToast('📶 Mengirim tes cetak ke Bluetooth...');
        const bytes = buildEscPosBytes(testText, state.autoCut !== false);
        await sendBytesToBluetooth(bytes);
        showToast('✅ Tes cetak Bluetooth berhasil!');
      } catch (e) {
        showToast('❌ Gagal: ' + e.message);
      }
    } else {
      showToast('⚠️ Hubungkan printer Bluetooth terlebih dahulu.');
      await requestConnectBluetooth();
    }
    return;
  }

  printViaBrowserDialog(testText);
}

// Fungsi Cetak via Dialog Browser / Windows (Bebas Iframe Rusak & Selalu Stabil)
function printViaBrowserDialog(customText = null) {
  const receiptText = customText || generateMonospaceReceipt();

  // 1. Isi container cetak #print-content di DOM utama
  const printContent = document.getElementById('print-content');
  if (printContent) {
    printContent.textContent = receiptText;
  }

  // 2. Pastikan kelas ukuran kertas terpasang pada body
  if (state.paperSize === '80mm') {
    document.body.classList.remove('print-58mm');
    document.body.classList.add('print-80mm');
  } else {
    document.body.classList.remove('print-80mm');
    document.body.classList.add('print-58mm');
  }

  // 3. Kalibrasi ukuran font cetak
  applyFontCalibration();

  // 4. Langsung panggil window.print() (standar resmi peramban web)
  window.print();
}

// Tambah Item Baru
function addItem() {
  state.items.push({
    id: Date.now(),
    category: '',
    name: '',
    variant: '',
    qty: 1,
    price: 0
  });
  renderItemsTable();
  updateReceipt();
  saveToStorage();
}

// Hapus Item
function removeItem(id) {
  if (state.items.length <= 1) {
    showToast('Minimal harus ada 1 baris barang');
    return;
  }
  state.items = state.items.filter(item => item.id !== id);
  renderItemsTable();
  updateReceipt();
  saveToStorage();
}

// Render Tabel Item Kasir
function renderItemsTable() {
  const tbody = document.getElementById('items-tbody');
  tbody.innerHTML = '';

  state.items.forEach((item, index) => {
    const tr = document.createElement('tr');
    const total = (item.qty || 0) * (item.price || 0);

    tr.innerHTML = `
      <td style="text-align: center; font-weight: 700; color: #64748b;">${index + 1}</td>
      <td>
        <input type="text" placeholder="cth: Poster" value="${escapeHtml(item.category || '')}" data-id="${item.id}" data-field="category">
      </td>
      <td>
        <input type="text" placeholder="cth: IV.260 1MK" value="${escapeHtml(item.name || '')}" data-id="${item.id}" data-field="name">
      </td>
      <td>
        <input type="text" placeholder="cth: (A3)" value="${escapeHtml(item.variant || '')}" data-id="${item.id}" data-field="variant">
      </td>
      <td>
        <input type="number" min="1" step="1" value="${item.qty}" data-id="${item.id}" data-field="qty" style="text-align: center;">
      </td>
      <td>
        <input type="number" min="0" step="500" value="${item.price}" data-id="${item.id}" data-field="price" style="text-align: right;">
      </td>
      <td class="item-subtotal">
        ${formatNum(total)}
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn-danger-sm" onclick="removeItem(${item.id})" title="Hapus baris">✕</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Attach input listeners to dynamically rendered table rows
  tbody.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const field = e.target.dataset.field;
      const item = state.items.find(i => i.id === id);
      if (!item) return;

      if (field === 'qty' || field === 'price') {
        item[field] = parseFloat(e.target.value) || 0;
        // Update subtotal cell in current row
        const row = e.target.closest('tr');
        const subtotalCell = row.querySelector('.item-subtotal');
        if (subtotalCell) {
          subtotalCell.textContent = formatNum(item.qty * item.price);
        }
      } else {
        item[field] = e.target.value;
      }

      updateReceipt();
      saveToStorage();
    });
  });
}

// Sinkronisasi State ke Form Input
function syncStateToForm() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  };

  setVal('store-name', state.store.name);
  setVal('store-address', state.store.address);
  setVal('store-phone', state.store.phone);
  setVal('operator-name', state.operator);
  setVal('cashier-name', state.cashier);
  setVal('customer-name', state.customer.name);
  setVal('customer-phone', state.customer.phone);
  setVal('order-no', state.order.no);
  setVal('order-datetime', state.order.datetime);
  setVal('order-deadline', state.order.deadline);
  setVal('cost-finishing', state.payment.finishing);
  setVal('cost-discount', state.payment.discount);
  setVal('amount-paid', state.payment.paid);
  setVal('payment-status', state.payment.status);
  setVal('receipt-notes', state.notes);
  setVal('receipt-slogan', state.slogan);
  setVal('receipt-website', state.website);
}

// Helper Word-Wrapping dengan Perataan Otomatis (Sejajar dengan Teks di Atasnya)
function wrapTextAligned(text, maxLen, firstIndent = '', nextIndent = '') {
  if (!text || text.trim().length === 0) {
    return [firstIndent];
  }

  const words = text.trim().split(/\s+/);
  const lines = [];

  let currentPrefix = firstIndent;
  let currentWords = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = currentPrefix + (currentWords.length > 0 ? currentWords.join(' ') + ' ' : '') + word;

    if (candidate.length <= maxLen) {
      currentWords.push(word);
    } else {
      if (currentWords.length > 0) {
        lines.push(currentPrefix + currentWords.join(' '));
        currentPrefix = nextIndent;
        currentWords = [];
      }

      // Jika ada kata tunggal yang melebihi lebar sisa baris
      let available = maxLen - currentPrefix.length;
      if (available <= 0) available = 1;

      let remaining = word;
      while (remaining.length > available) {
        lines.push(currentPrefix + remaining.substring(0, available));
        remaining = remaining.substring(available);
        currentPrefix = nextIndent;
        available = maxLen - currentPrefix.length;
        if (available <= 0) available = 1;
      }
      currentWords.push(remaining);
    }
  }

  if (currentWords.length > 0) {
    lines.push(currentPrefix + currentWords.join(' '));
  }

  return lines;
}

// Generator Teks Monospace Struk (Presisi Sesuai Template Baru)
function generateMonospaceReceipt() {
  const lineWidth = 37;
  const divider = ' ' + '-'.repeat(36);

  let out = [];

  // Toko Header
  wrapTextAligned(state.store.name, lineWidth, ' ', ' ').forEach(l => out.push(l));
  wrapTextAligned(state.store.address, lineWidth, ' ', ' ').forEach(l => out.push(l));
  wrapTextAligned(state.store.phone, lineWidth, ' ', ' ').forEach(l => out.push(l));
  out.push('  ');

  // Info Customer & Transaksi (Label rata 11 karakter)
  wrapTextAligned(state.customer.name, lineWidth, ' Customer  ', '           ').forEach(l => out.push(l));
  wrapTextAligned(state.customer.phone, lineWidth, ' Telephone ', '           ').forEach(l => out.push(l));
  wrapTextAligned(state.order.no, lineWidth, ' No.Order  ', '           ').forEach(l => out.push(l));
  wrapTextAligned(state.order.datetime, lineWidth, ' Tanggal   ', '           ').forEach(l => out.push(l));
  wrapTextAligned(state.operator, lineWidth, ' Operator  ', '           ').forEach(l => out.push(l));
  wrapTextAligned(state.order.deadline, lineWidth, ' Deadline  ', '           ').forEach(l => out.push(l));
  wrapTextAligned(state.cashier, lineWidth, ' Kasir     ', '           ').forEach(l => out.push(l));
  out.push(divider);

  // Items
  let subTotal = 0;
  state.items.forEach((item, index) => {
    const itemTotal = (item.qty || 0) * (item.price || 0);
    subTotal += itemTotal;

    // Line 1:  1. Poster                       
    const catStr = item.category ? item.category.trim() : (item.name ? item.name.trim() : '');
    const numPrefix = ` ${index + 1}. `;
    const numIndent = ' '.repeat(numPrefix.length);
    wrapTextAligned(catStr, lineWidth, numPrefix, numIndent).forEach(l => out.push(l));

    // Line 2:     IV.260 1MK              (A3)
    const nameStr = item.name ? item.name.trim() : '';
    const variantStr = item.variant ? item.variant.trim() : '';
    const indent4 = '    ';
    const availableTotal = lineWidth - 4; // 33 karakter

    if (variantStr.length > 0) {
      const maxFirstNameLen = Math.max(5, availableTotal - variantStr.length - 1);
      
      if (nameStr.length <= maxFirstNameLen) {
        const spacesBetween = Math.max(1, availableTotal - nameStr.length - variantStr.length);
        out.push(indent4 + nameStr + ' '.repeat(spacesBetween) + variantStr);
      } else {
        const words = nameStr.split(/\s+/);
        let firstLineWords = [];
        let remainingWords = [];
        let currentLen = 0;

        for (const w of words) {
          const testLen = currentLen === 0 ? w.length : currentLen + 1 + w.length;
          if (testLen <= maxFirstNameLen && remainingWords.length === 0) {
            firstLineWords.push(w);
            currentLen = testLen;
          } else {
            remainingWords.push(w);
          }
        }

        const firstPart = firstLineWords.join(' ');
        const spacesBetween = Math.max(1, availableTotal - firstPart.length - variantStr.length);
        out.push(indent4 + firstPart + ' '.repeat(spacesBetween) + variantStr);

        if (remainingWords.length > 0) {
          const restName = remainingWords.join(' ');
          wrapTextAligned(restName, lineWidth, indent4, indent4).forEach(l => out.push(l));
        }
      }
    } else {
      wrapTextAligned(nameStr, lineWidth, indent4, indent4).forEach(l => out.push(l));
    }

    // Line 3:          1 X      4,700  =      4,700
    const indent9 = '         ';
    const qtyStr = (item.qty || 0).toString().padStart(2, ' ') + ' X';
    const priceStr = formatNum(item.price || 0).padStart(11, ' ');
    const equalStr = '  = ';
    const totalStr = formatNum(itemTotal).padStart(10, ' ');
    out.push(indent9 + qtyStr + priceStr + equalStr + totalStr);
  });

  out.push(divider);

  // Totals Section
  const calcRow = (label, value) => {
    const indent10 = '          ';
    const labelPadded = label.padEnd(13, ' ');
    const curr = 'Rp.';
    const valPadded = formatNum(value).padStart(11, ' ');
    return indent10 + labelPadded + curr + valPadded;
  };

  const finishing = state.payment.finishing || 0;
  const discount = state.payment.discount || 0;
  const grandTotal = subTotal + finishing - discount;
  const paid = state.payment.paid || 0;
  const change = Math.max(0, paid - grandTotal);

  out.push(calcRow('Sub Total', subTotal));
  out.push(calcRow('By Finishing', finishing));
  out.push(calcRow('Discount', discount));
  out.push(calcRow('Grand Total', grandTotal));
  out.push(calcRow('Bayar', paid));

  if (paid > grandTotal || change > 0) {
    out.push(calcRow('Kembali', change));
  }

  out.push('');

  // Perhatian
  out.push(' Perhatian :');
  if (state.notes) {
    const noteLines = state.notes.split('\n');
    noteLines.forEach(rawLine => {
      const trimmed = rawLine.trim();
      if (trimmed.length > 0) {
        const listMatch = trimmed.match(/^(\d+[\.\)]\s*)(.*)/);
        if (listMatch) {
          const numPrefix = ' ' + listMatch[1];
          const nextIndent = '   ';
          wrapTextAligned(listMatch[2], lineWidth, numPrefix, nextIndent).forEach(l => out.push(l));
        } else {
          wrapTextAligned(trimmed, lineWidth, '   ', '   ').forEach(l => out.push(l));
        }
      }
    });
  }
  out.push('');

  // Status Lunas
  out.push(` ${state.payment.status}`);
  out.push('');
  out.push('');

  // Slogan & Website
  const sloganStr = state.slogan.trim();
  const sloganPad = Math.max(0, Math.floor((lineWidth - sloganStr.length) / 2));
  out.push(' '.repeat(sloganPad) + sloganStr);
  out.push('');

  const webStr = state.website.trim();
  const webSpaces = Math.max(0, Math.floor((lineWidth - webStr.length) / 2));
  out.push(' '.repeat(webSpaces) + webStr);

  return out.join('\n');
}

// Generator Teks Format Markdown Sesuai Contoh User
function generateMarkdownReceipt() {
  const receipt = generateMonospaceReceipt();
  return '```\n' + receipt + '\n```';
}

// Update Live Preview Struk & Ringkasan Perhitungan
function updateReceipt() {
  const receiptText = generateMonospaceReceipt();
  
  const receiptElem = document.getElementById('receipt-content');
  if (receiptElem) {
    receiptElem.textContent = receiptText;
  }

  // Hitung Totals untuk Panel Input
  let subTotal = 0;
  state.items.forEach(item => {
    subTotal += (item.qty || 0) * (item.price || 0);
  });

  const finishing = state.payment.finishing || 0;
  const discount = state.payment.discount || 0;
  const grandTotal = subTotal + finishing - discount;
  const paid = state.payment.paid || 0;
  const change = Math.max(0, paid - grandTotal);

  const subEl = document.getElementById('sum-subtotal');
  const grandEl = document.getElementById('sum-grandtotal');
  const changeEl = document.getElementById('sum-change');

  if (subEl) subEl.textContent = `Rp. ${formatNum(subTotal)}`;
  if (grandEl) grandEl.textContent = `Rp. ${formatNum(grandTotal)}`;
  if (changeEl) changeEl.textContent = `Rp. ${formatNum(change)}`;
}

// Toggle Collapse Card
function toggleCard(headerEl) {
  const card = headerEl.closest('.card');
  if (card) {
    card.classList.toggle('collapsed');
  }
}

// Escape HTML Helper
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Toast Notifikasi
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// LocalStorage Persist (Hanya menyimpan profil toko dan setting cetak)
function saveToStorage() {
  try {
    const config = {
      store: state.store,
      notes: state.notes,
      slogan: state.slogan,
      website: state.website,
      paperSize: state.paperSize,
      printFontSize: state.printFontSize,
      selectedPrinter: state.selectedPrinter,
      autoCut: state.autoCut,
      printMode: state.printMode
    };
    localStorage.setItem('mangrove_pos_config', JSON.stringify(config));
  } catch (e) {
    console.error('Error saving config', e);
  }
}

function loadFromStorage() {
  try {
    // Hapus data transaksi sesi lama jika masih tersimpan di browser
    localStorage.removeItem('mangrove_pos_state');

    const saved = localStorage.getItem('mangrove_pos_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.store) state.store = { ...state.store, ...parsed.store };
      if (parsed.notes) state.notes = parsed.notes;
      if (parsed.slogan) state.slogan = parsed.slogan;
      if (parsed.website) state.website = parsed.website;
      if (parsed.paperSize) state.paperSize = parsed.paperSize;
      if (parsed.printFontSize) state.printFontSize = parsed.printFontSize;
      if (parsed.selectedPrinter) state.selectedPrinter = parsed.selectedPrinter;
      if (parsed.autoCut !== undefined) state.autoCut = parsed.autoCut;
      if (parsed.printMode) state.printMode = parsed.printMode;
    }
    syncStateToForm();
  } catch (e) {
    console.error('Error loading config', e);
  }
}

