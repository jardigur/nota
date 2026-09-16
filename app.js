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
  printFontSize: 7 // Ukuran font cetak default 7pt (standar 58mm)
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
    printThermalReceipt();
  };

  document.getElementById('btn-print').addEventListener('click', triggerPrint);
  document.getElementById('btn-print-2').addEventListener('click', triggerPrint);
}

// Fungsi Cetak Struk Thermal Presisi Tinggi (Menggunakan Isolated Iframe & Fallback)
function printThermalReceipt() {
  const rawReceipt = generateMonospaceReceipt();
  const fontPt = state.printFontSize || (state.paperSize === '80mm' ? 9.5 : 7);
  const paperWidth = state.paperSize === '80mm' ? '72mm' : '48mm';
  const pageSize = state.paperSize === '80mm' ? '80mm auto' : '58mm auto';

  // Siapkan juga print-content bawaan untuk fallback Ctrl+P
  const printContent = document.getElementById('print-content');
  if (printContent) {
    printContent.textContent = rawReceipt;
  }

  // Gunakan isolated iframe untuk hasil print 100% presisi bebas gangguan margin/header browser
  let iframe = document.getElementById('print-thermal-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'print-thermal-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Struk - ${escapeHtml(state.store.name)}</title>
  <style>
    @page {
      size: ${pageSize};
      margin: 5mm !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      width: ${paperWidth} !important;
    }
    pre {
      font-family: 'Consolas', 'Lucida Console', 'Courier New', monospace !important;
      font-size: ${fontPt}pt !important;
      line-height: 1.25 !important;
      letter-spacing: -0.1px !important;
      white-space: pre !important;
      word-break: normal !important;
      overflow-wrap: normal !important;
      margin: 0 !important;
      padding: 1mm 0 3mm 0 !important;
      width: ${paperWidth} !important;
      max-width: ${paperWidth} !important;
      box-sizing: border-box !important;
      color: #000000 !important;
    }
  </style>
</head>
<body>
  <pre>${escapeHtml(rawReceipt)}</pre>
</body>
</html>`);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, 250);
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
      printFontSize: state.printFontSize
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
    }
    syncStateToForm();
  } catch (e) {
    console.error('Error loading config', e);
  }
}

