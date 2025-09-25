# Kick Chat (EndomY) Extension

## English Explanation

### Overview
**Kick Chat** is a browser extension for automating chat message sending on the Kick platform. It allows users to send messages (such as emotes or custom text) at configurable intervals. The extension provides a rich user interface for configuration, status monitoring, and control both via popup and as an overlay inside Kick chat.

---

### Features

- **Auto-sending Messages:** Automatically sends messages to Kick chat at intervals you set.
- **Delay Options:** Choose minimum and maximum time between messages, or use a fast mode.
- **Run Duration:** Set how many minutes the tool will run before stopping automatically.
- **Modes:**
  - **Random:** Random delay between min and max.
  - **Max:** Always waits for max seconds.
  - **Fast:** Sends as fast as possible (every 1 second) with a specific message.
- **Message Modes:**
  - **Emotes Mode:** Uses a default list of popular Kick emotes.
  - **Customize Mode:** Create and manage your own lists of messages to send.
- **Stats & Status Panel:** See sent messages count, lines entered, next send countdown, and remaining time.
- **Overlay Panel:** Show/hide a draggable, collapsible control/status panel inside Kick.com.
- **Popup UI:** Configure all settings from the extension popup.
- **Persistent Storage:** All settings and message lists are saved in your browser.
- **Badge Status:** Extension icon changes color and letter based on active mode.

---

### How To Use

#### 1. Installation
- Load as an unpacked extension in your Chromium-based browser (like Chrome or Edge).
- Go to `chrome://extensions/`, enable "Developer mode", then "Load unpacked" and select this folder.

#### 2. Settings (Popup)
- Click the extension icon to open the popup.
- Set **Min Time** and **Max Time** (seconds between messages).
- Set **Run Duration** (in minutes, optional).
- Choose a **Mode**: Random, Max, or Fast.
- Set **Message Mode**:
  - **Emotes Mode:** Use built-in emote messages.
  - **Customize:** Make custom lists (add, edit, delete) and enter your own messages.
- For **Fast Mode**, set the message text in "Fast Mode Text".
- Use **Save** to store settings.
- Use **Start** to begin auto-sending messages, **Stop** to stop.
- **Show Table Inside Kick**: Toggles the overlay panel on Kick.com.

#### 3. Overlay Panel
- When enabled, a floating panel appears on Kick.com.
- Drag to move, collapse/expand for more info.
- Start/Stop the spammer from here.
- See live stats: messages sent, next message in, remaining time, etc.

#### 4. Badge
- Extension icon shows:
  - `R` Green for Random
  - `M` Yellow for Max
  - `F` Red for Fast
- No letter if stopped.

---

### Files Overview

#### `manifest.json`
Defines extension metadata, permissions, background and content scripts.

#### `background.js`
Handles badge updates and syncs extension state.

#### `content.js`
Manages the overlay panel, listens for storage updates, and executes the actual chat sending logic in the Kick website.

#### `popup.html` & `popup.js`
User interface for configuration. Handles all settings, message list management, and user interactions.

---

### Usage Notes

- Only works on Kick chat pages.
- Custom message lists are saved per browser.
- Always review your settings before starting.

---

## شرح عربي

### نظرة عامة
**Kick Chat (EndomY)** هي إضافة متصفح أوتوماتيكية لإرسال رسائل في دردشة موقع Kick. تتيح لك إرسال رسائل (إيموجي أو نصوص مخصصة) حسب فترات زمنية تحددها أنت، مع واجهة سهلة للتحكم والإعدادات.

---

### الميزات

- **إرسال تلقائي:** ترسل رسائل تلقائيًا لدردشة Kick حسب الوقت الذي تحدده.
- **خيارات التأخير:** حدّد الحد الأدنى والأقصى للوقت بين الرسائل، أو استخدم الوضع السريع.
- **مدة التشغيل:** حدّد عدد الدقائق التي يعمل فيها الأوتوماتيك قبل أن يتوقف تلقائيًا.
- **الأوضاع:**
  - **عشوائي:** زمن عشوائي بين الحدين.
  - **حد أقصى:** ينتظر دومًا الحد الأقصى.
  - **سريع:** يرسل كل ثانية مع نص محدد.
- **أوضاع الرسائل:**
  - **وضع الإيموجي:** يستخدم لائحة افتراضية من إيموجي Kick الشهيرة.
  - **تخصيص:** أنشئ لوائح رسائل خاصة بك (إضافة/تعديل/حذف).
- **لوحة إحصائيات وحالة:** عرض عدد الرسائل المرسلة، وعدد الأسطر، والعد التنازلي، والوقت المتبقي.
- **لوحة عائمة:** يمكنك إظهار/إخفاء لوحة تحكم عائمة وقابلة للسحب داخل موقع Kick.
- **واجهة منبثقة:** إعداد جميع الخيارات من نافذة الإضافة.
- **حفظ دائم:** جميع الإعدادات تُخزّن في المتصفح.
- **شعار الإضافة:** يتغيّر حسب وضع التشغيل (حرف ولون).

---

### طريقة الاستخدام

#### 1. التثبيت
- قم بتحميل الإضافة كـ "Unpacked Extension" في متصفح كروميوم (كروم أو إيدج).
- اذهب إلى `chrome://extensions/`، فعّل "Developer mode"، ثم "Load unpacked" واختر هذا المجلد.

#### 2. الإعدادات (النافذة المنبثقة)
- اضغط على أيقونة الإضافة لفتح النافذة المنبثقة.
- عيّن الحد الأدنى والأقصى للوقت (بالثواني).
- عيّن مدة التشغيل (بالدقائق، اختياري).
- اختر الوضع: عشوائي، حد أقصى، أو سريع.
- اختر وضع الرسالة:
  - **إيموجي:** يستخدم الرسائل الافتراضية.
  - **تخصيص:** أنشئ لوائحك الخاصة وأضف رسائلك.
- في وضع السريع، ادخل نص الرسالة المطلوبة.
- زر **حفظ** لتخزين الإعدادات.
- زر **بدء** لتشغيل الإرسال التلقائي، **إيقاف** لإيقافه.
- **إظهار الجدول داخل Kick:** لإظهار/إخفاء اللوحة العائمة.

#### 3. اللوحة العائمة
- عند التفعيل، تظهر لوحة عائمة داخل صفحة Kick.
- يمكنك سحبها، إظهار التفاصيل أو إخفاؤها.
- تحكم في بدء/إيقاف الأوتوماتيك من هنا أيضًا.
- تعرض إحصائيات لحظية.

#### 4. الشعار
- أيقونة الإضافة تظهر:
  - `R` أخضر للوضع العشوائي
  - `M` أصفر للوضع الأقصى
  - `F` أحمر للوضع السريع
- بدون حرف عند الإيقاف.

---

### ملاحظات

- تعمل فقط على صفحات دردشة Kick.
- قوائم الرسائل المخصصة تُخزّن في المتصفح فقط.
- راجع إعداداتك قبل البدء.

---

## Author
- [BGN](https://github.com/bgnbgnm)
