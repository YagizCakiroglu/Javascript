// Dil seçeneklerini doldur
const selectTags = document.querySelectorAll('select');
let lastDetectedLanguage = '';

selectTags.forEach((tag, id) => {
    for (let country_code in countries) {
        let selected = id === 0 ? (country_code === "en" ? "selected" : "") : (country_code === "es" ? "selected" : "");
        let option = `<option ${selected} value="${country_code}">${countries[country_code]}</option>`;
        tag.insertAdjacentHTML("beforeend", option);
    }
});

// Input alanındaki değişiklikleri dinle
const inputText = document.getElementById('inputText');
let detectTimeout;

inputText.addEventListener('input', function() {
    clearTimeout(detectTimeout);
    const text = this.value.trim();
    
    if (text.length > 3) {
        detectTimeout = setTimeout(() => detectLanguage(text), 500);
    }
});

// Dil algılama fonksiyonu
async function detectLanguage(text) {
    try {
        const isLatinScript = /^[A-Za-z\s.,!?'"()-]+$/.test(text);
        const hasCyrillicChars = /[\u0400-\u04FF]/.test(text);
        const hasChineseChars = /[\u4E00-\u9FFF]/.test(text);
        const hasJapaneseChars = /[\u3040-\u309F\u30A0-\u30FF]/.test(text);
        const hasKoreanChars = /[\uAC00-\uD7AF\u1100-\u11FF]/.test(text);
        const hasArabicChars = /[\u0600-\u06FF]/.test(text);
        
        let detectedLang = 'en';

        if (hasArabicChars) detectedLang = 'ar-SA';
        else if (hasCyrillicChars) detectedLang = 'ru-RU';
        else if (hasChineseChars) detectedLang = 'zh-CN';
        else if (hasJapaneseChars) detectedLang = 'ja-JP';
        else if (hasKoreanChars) detectedLang = 'ko-KR';
        
        if (detectedLang !== lastDetectedLanguage) {
            lastDetectedLanguage = detectedLang;
            document.getElementById('translateFrom').value = detectedLang;
            
            const inputSection = document.querySelector('.input-section');
            inputSection.style.transition = 'box-shadow 0.3s ease';
            inputSection.style.boxShadow = '0 0 0 2px var(--primary-color)';
            setTimeout(() => {
                inputSection.style.boxShadow = 'var(--shadow)';
            }, 1000);
        }
    } catch (error) {
        console.error('Dil algılama hatası:', error);
    }
}

// Çeviri fonksiyonu
async function translateText(inputText, fromLang, toLang) {
    // Çıktı alanını temizle ve yükleniyor mesajını göster
    const outputElement = document.getElementById('outputText');
    outputElement.innerHTML = '<div class="loading">Translating...</div>';

    try {
        if (!inputText || inputText.trim() === '') {
            outputElement.innerText = "Please enter some text to translate.";
            return;
        }

        const fromLangCode = fromLang.split('-')[0];
        const toLangCode = toLang.split('-')[0];
        
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText)}&langpair=${fromLangCode}|${toLangCode}`);
        const data = await response.json();
        
        if (data.responseData && data.responseData.translatedText) {
            const translatedText = data.responseData.translatedText;
            // Null check ekleyelim
            const formattedText = translatedText ? removeQuestionMarks(translatedText) : translatedText;
            outputElement.innerText = formattedText || "Translation not available.";
        } else {
            throw new Error(data.responseMessage || 'Translation failed');
        }
    } catch (error) {
        console.error('Translation error:', error);
        outputElement.innerText = "Error: Could not translate! Please try again.";
    }
}

// Soru işaretlerini kaldır
function removeQuestionMarks(text) {
    if (!text) return '';
    return text.replace(/^¿+|¿+$/g, '');
}

// Konuşma fonksiyonu
function speakText(text, lang) {
    if (!text || text.trim() === '') return;

    // Mevcut konuşmayı durdur
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang.split('-')[0];
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;
    
    const speakBtn = document.getElementById('speakBtn');
    const originalContent = speakBtn.innerHTML;
    
    speakBtn.innerHTML = '🔊 <span class="speaking-dot">...</span>';
    speakBtn.classList.add('speaking');
    
    utterance.onend = () => {
        speakBtn.innerHTML = originalContent;
        speakBtn.classList.remove('speaking');
    };

    // Hata durumunda butonu normal haline getir
    utterance.onerror = () => {
        speakBtn.innerHTML = originalContent;
        speakBtn.classList.remove('speaking');
        console.error('Speech synthesis error');
    };

    window.speechSynthesis.speak(utterance);
}

// Event Listeners
document.getElementById('translateBtn').addEventListener('click', function() {
    const text = document.getElementById('inputText').value;
    const translateFrom = document.getElementById('translateFrom').value;
    const translateTo = document.getElementById('translateTo').value;
    translateText(text, translateFrom, translateTo);
});

document.getElementById('speakBtn').addEventListener('click', function() {
    const translatedText = document.getElementById('outputText').innerText;
    const toLang = document.getElementById('translateTo').value;
    if (translatedText && translatedText !== '' && translatedText !== 'Translating...') {
        speakText(translatedText, toLang);
    }
});