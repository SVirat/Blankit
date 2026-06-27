// src/core/locales.js — Multi-language PII detection data
// -----------------------------------------------------------------------------
// Provides localized keyword sets, month names, address vocabulary, common
// names, stop-words and CJK/Cyrillic detection hints for the PII engine.
//
// Architecture:
//   • Each supported language contributes a small data table (keywords only).
//   • `build()` merges the requested languages into a single, regex-ready
//     structure that pii-engine.js consumes additively — English detection is
//     never replaced, only supplemented, so there is zero English regression.
//   • Chrome auto-detects the user's language at runtime via chrome.i18n
//     (getUILanguage). When that API is unavailable (MAIN world / tests) the
//     module gracefully merges ALL supported languages, guaranteeing detection
//     for mixed-language content without any user configuration.
//
// Languages: en (base) + ja, fr, ru, pt, es, de, zh
(function () {
    'use strict';

    // =========================================================================
    // Per-language data tables
    // =========================================================================
    // Keys (all optional — graceful fallback when omitted):
    //   months          → localized month names (for date detection)
    //   addressPrefix   → street-type words that PRECEDE the street name
    //   addressSuffix   → street-type words that are GLUED as a suffix (German)
    //   passport/dl/medical/bank/credentials → label keywords for prefixed IDs
    //   commonNames     → Latin-script first names always redacted standalone
    //   stopWords       → Latin-script words that must NEVER be treated as names
    //   cyrillicNames   → Cyrillic first names always redacted standalone
    //   cyrillicStop    → Cyrillic words that must NEVER be treated as names
    //   honorifics      → CJK honorifics that FOLLOW a person name
    //   nameLabels      → CJK "name:" style labels that PRECEDE a person name
    //   surnames        → CJK surnames used to anchor name detection

    var DATA = {
        en: {
            // English detection is fully handled by the base patterns in
            // pii-engine.js. This entry exists only so `en` is a valid locale
            // and contributes nothing to the merged localized rules.
        },

        fr: {
            months: ['janvier', 'février', 'fevrier', 'mars', 'avril', 'mai', 'juin',
                'juillet', 'août', 'aout', 'septembre', 'octobre', 'novembre', 'décembre', 'decembre'],
            addressPrefix: ['rue', 'avenue', 'av', 'boulevard', 'bd', 'place', 'impasse',
                'allée', 'allee', 'chemin', 'quai', 'cours', 'route'],
            passport: ['passeport', 'numéro de passeport', 'numero de passeport'],
            dl: ['permis de conduire', 'permis'],
            medical: ['dossier médical', 'dossier medical', 'numéro de patient', 'numero de patient'],
            bank: ['compte', 'numéro de compte', 'numero de compte', 'IBAN'],
            credentials: ['mot de passe', 'motdepasse'],
            nameIntro: ["je m'appelle", 'je suis', 'mon nom est', 'monsieur', 'madame', 'mademoiselle'],
            commonNames: ['Jean', 'Pierre', 'Michel', 'Philippe', 'Nicolas', 'François', 'Francois',
                'Luc', 'Marc', 'Julien', 'Olivier', 'Marie', 'Sophie', 'Claire', 'Camille',
                'Nathalie', 'Isabelle', 'Céline', 'Celine', 'Émilie', 'Emilie', 'Manon'],
            stopWords: ['Le', 'La', 'Les', 'Un', 'Une', 'Des', 'Du', 'De', 'Je', 'Tu', 'Il', 'Elle',
                'Nous', 'Vous', 'Ils', 'Elles', 'Et', 'Ou', 'Mais', 'Donc', 'Car', 'Avec', 'Pour',
                'Dans', 'Sur', 'Sous', 'Par', 'Bonjour', 'Bonsoir', 'Salut', 'Merci', 'Monsieur',
                'Madame', 'Mademoiselle', 'Cher', 'Chère', 'Chere', 'Mon', 'Ma', 'Mes', 'Votre',
                'Vos', 'Numéro', 'Numero', 'Compte', 'Passeport', 'Adresse', 'Rue', 'Cordialement']
        },

        de: {
            months: ['Januar', 'Februar', 'März', 'Maerz', 'April', 'Mai', 'Juni', 'Juli',
                'August', 'September', 'Oktober', 'November', 'Dezember'],
            addressSuffix: ['straße', 'strasse', 'str', 'gasse', 'weg', 'platz', 'allee', 'ring', 'damm'],
            passport: ['reisepass', 'pass', 'passnummer', 'reisepassnummer'],
            dl: ['führerschein', 'fuehrerschein', 'führerscheinnummer'],
            medical: ['patientennummer', 'krankenakte', 'versichertennummer'],
            bank: ['konto', 'kontonummer', 'IBAN'],
            credentials: ['passwort', 'kennwort'],
            nameIntro: ['ich heiße', 'ich heisse', 'mein name ist', 'ich bin', 'herr', 'frau'],
            commonNames: ['Hans', 'Klaus', 'Jürgen', 'Juergen', 'Stefan', 'Andreas', 'Thomas',
                'Michael', 'Wolfgang', 'Dieter', 'Anna', 'Petra', 'Sabine', 'Monika', 'Ursula',
                'Helga', 'Renate', 'Karin', 'Greta'],
            stopWords: ['Der', 'Die', 'Das', 'Ein', 'Eine', 'Einen', 'Einer', 'Dem', 'Den', 'Des',
                'Ich', 'Du', 'Er', 'Sie', 'Es', 'Wir', 'Ihr', 'Und', 'Oder', 'Aber', 'Denn', 'Mit',
                'Für', 'Fuer', 'Von', 'Auf', 'Aus', 'Bei', 'Nach', 'Über', 'Ueber', 'Unter', 'Vor',
                'Ist', 'Sind', 'War', 'Waren', 'Hat', 'Haben', 'Wird', 'Werden', 'Hallo', 'Guten',
                'Tag', 'Morgen', 'Abend', 'Sehr', 'Geehrte', 'Geehrter', 'Herr', 'Frau', 'Vielen',
                'Dank', 'Danke', 'Mein', 'Meine', 'Ihre', 'Bitte', 'Nummer', 'Konto', 'Passwort',
                'Reisepass', 'Straße', 'Strasse', 'Adresse', 'Mfg', 'Grüße', 'Gruesse']
        },

        es: {
            months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
                'agosto', 'septiembre', 'setiembre', 'octubre', 'noviembre', 'diciembre'],
            addressPrefix: ['calle', 'avenida', 'av', 'avda', 'plaza', 'paseo', 'carretera',
                'camino', 'ronda', 'travesía', 'travesia'],
            passport: ['pasaporte', 'número de pasaporte', 'numero de pasaporte'],
            dl: ['licencia de conducir', 'permiso de conducir', 'carné de conducir', 'carnet de conducir'],
            medical: ['número de paciente', 'numero de paciente', 'historia clínica', 'historia clinica'],
            bank: ['cuenta', 'número de cuenta', 'numero de cuenta', 'IBAN'],
            credentials: ['contraseña', 'clave'],
            nameIntro: ['me llamo', 'mi nombre es', 'soy', 'señor', 'senor', 'señora', 'senora', 'don', 'doña', 'dona'],
            commonNames: ['José', 'Jose', 'Juan', 'Carlos', 'Manuel', 'Antonio', 'Francisco',
                'Javier', 'Miguel', 'Pedro', 'María', 'Maria', 'Carmen', 'Ana', 'Sofía', 'Sofia',
                'Lucía', 'Lucia', 'Isabel', 'Laura', 'Elena'],
            stopWords: ['El', 'La', 'Los', 'Las', 'Un', 'Una', 'Unos', 'Unas', 'Yo', 'Tú', 'Tu',
                'Él', 'Ella', 'Nosotros', 'Vosotros', 'Ellos', 'Y', 'O', 'Pero', 'Con', 'Para',
                'Por', 'Sin', 'Sobre', 'Hola', 'Buenos', 'Buenas', 'Días', 'Dias', 'Gracias',
                'Señor', 'Senor', 'Señora', 'Senora', 'Estimado', 'Estimada', 'Mi', 'Mis', 'Su',
                'Número', 'Numero', 'Cuenta', 'Pasaporte', 'Dirección', 'Direccion', 'Calle', 'Saludos']
        },

        pt: {
            months: ['janeiro', 'fevereiro', 'março', 'marco', 'abril', 'maio', 'junho',
                'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
            addressPrefix: ['rua', 'avenida', 'av', 'praça', 'praca', 'travessa', 'alameda',
                'estrada', 'largo', 'rodovia'],
            passport: ['passaporte', 'número do passaporte', 'numero do passaporte'],
            dl: ['carteira de motorista', 'carta de condução', 'carta de conducao', 'CNH'],
            medical: ['número do paciente', 'numero do paciente', 'prontuário', 'prontuario'],
            bank: ['conta', 'número da conta', 'numero da conta', 'IBAN'],
            credentials: ['senha', 'palavra-passe'],
            nameIntro: ['meu nome é', 'meu nome e', 'eu sou', 'sou o', 'sou a', 'senhor', 'senhora'],
            commonNames: ['João', 'Joao', 'José', 'Jose', 'António', 'Antonio', 'Manuel', 'Carlos',
                'Pedro', 'Paulo', 'Rui', 'Tiago', 'Maria', 'Ana', 'Beatriz', 'Catarina', 'Inês',
                'Ines', 'Sofia', 'Mariana'],
            stopWords: ['O', 'A', 'Os', 'As', 'Um', 'Uma', 'Uns', 'Umas', 'Eu', 'Você', 'Voce',
                'Ele', 'Ela', 'Nós', 'Nos', 'Eles', 'Elas', 'E', 'Ou', 'Mas', 'Com', 'Para', 'Por',
                'Sem', 'Sobre', 'Olá', 'Ola', 'Bom', 'Boa', 'Dia', 'Obrigado', 'Obrigada', 'Senhor',
                'Senhora', 'Prezado', 'Prezada', 'Meu', 'Minha', 'Seu', 'Sua', 'Número', 'Numero',
                'Conta', 'Passaporte', 'Endereço', 'Endereco', 'Rua', 'Atenciosamente']
        },

        ru: {
            months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
                'августа', 'сентября', 'октября', 'ноября', 'декабря',
                'январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль',
                'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
            addressPrefixCyrillic: ['улица', 'ул', 'проспект', 'пр', 'переулок', 'пер',
                'бульвар', 'шоссе', 'набережная', 'площадь', 'проезд'],
            passport: ['паспорт', 'номер паспорта'],
            dl: ['водительское удостоверение', 'водительские права', 'права'],
            medical: ['номер пациента', 'медицинская карта', 'полис'],
            bank: ['счёт', 'счет', 'номер счёта', 'номер счета'],
            credentials: ['пароль'],
            cyrillicIntro: ['меня зовут', 'это', 'я'],
            cyrillicNames: ['Иван', 'Сергей', 'Андрей', 'Алексей', 'Дмитрий', 'Михаил', 'Владимир',
                'Николай', 'Александр', 'Павел', 'Анна', 'Мария', 'Елена', 'Ольга', 'Наталья',
                'Татьяна', 'Ирина', 'Екатерина', 'Светлана', 'Юлия'],
            cyrillicStop: ['И', 'В', 'Во', 'Не', 'На', 'Я', 'Что', 'Это', 'Как', 'Но', 'Из', 'За',
                'От', 'До', 'По', 'Со', 'Привет', 'Здравствуйте', 'Спасибо', 'Уважаемый', 'Уважаемая',
                'Господин', 'Госпожа', 'Дорогой', 'Дорогая', 'Мой', 'Моя', 'Ваш', 'Ваша', 'Номер',
                'Счёт', 'Счет', 'Пароль', 'Паспорт', 'Адрес', 'Улица', 'Город', 'Россия',
                'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье',
                'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь',
                'Октябрь', 'Ноябрь', 'Декабрь', 'Меня', 'Зовут', 'Мне', 'Тебя', 'Его', 'Её', 'Ее']
        },

        ja: {
            // Japanese dates use the 年/月/日 pattern handled by the engine's CJK date rule.
            passport: ['パスポート', '旅券', '旅券番号'],
            dl: ['運転免許', '運転免許証', '免許証', '免許番号'],
            medical: ['患者番号', 'カルテ番号', '保険証番号'],
            bank: ['口座番号', '口座'],
            credentials: ['パスワード', 'パス'],
            honorifics: ['さん', 'サン', '様', 'さま', '君', 'くん', 'ちゃん', '先生', '氏',
                '社長', '部長', '課長', '先輩'],
            nameLabels: ['名前', '氏名', 'お名前', '担当'],
            surnames: ['佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林',
                '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '清水',
                '斎藤', '山崎', '森', '池田', '橋本', '阿部', '石川', '前田', '藤田', '後藤', '小川']
        },

        zh: {
            passport: ['护照', '护照号', '护照号码'],
            dl: ['驾驶证', '驾照', '行驶证'],
            medical: ['病历号', '患者编号', '医保号'],
            bank: ['账号', '账户', '银行账号', '卡号'],
            credentials: ['密码'],
            honorifics: ['先生', '女士', '小姐', '老师', '同志', '医生', '教授', '经理', '总'],
            nameLabels: ['姓名', '名字', '联系人'],
            surnames: ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙',
                '朱', '马', '胡', '郭', '林', '何', '高', '罗', '郑', '梁', '谢', '宋', '唐',
                '许', '韩', '冯', '邓', '曹', '彭', '曾', '萧', '田', '董', '袁', '潘', '蒋',
                '蔡', '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈', '姚', '卢',
                '钟', '崔', '谭', '陆', '范', '金', '石', '廖', '贾', '夏', '韦', '付', '方', '白']
        }
    };

    var SUPPORTED = ['en', 'fr', 'de', 'es', 'pt', 'ru', 'ja', 'zh'];

    // =========================================================================
    // mergeArray — push unique values from src into dest
    // =========================================================================
    function mergeArray(dest, src) {
        if (!src) return;
        for (var i = 0; i < src.length; i++) {
            if (dest.indexOf(src[i]) === -1) dest.push(src[i]);
        }
    }

    // =========================================================================
    // build(langs) — merge requested languages into one regex-ready structure
    // English base detection in pii-engine.js is always preserved; this only
    // supplements it. Unknown languages are skipped (graceful fallback).
    // =========================================================================
    function build(langs) {
        if (!langs || !langs.length) langs = SUPPORTED.slice();

        var merged = {
            months: [], addressPrefix: [], addressSuffix: [], addressPrefixCyrillic: [],
            passport: [], dl: [], medical: [], bank: [], credentials: [],
            commonNames: [], stopWords: [], cyrillicNames: [], cyrillicStop: [],
            nameIntro: [], cyrillicIntro: [],
            honorifics: [], nameLabels: [], surnames: []
        };

        for (var i = 0; i < langs.length; i++) {
            var d = DATA[langs[i]];
            if (!d) continue; // unknown language → skip (graceful fallback)
            mergeArray(merged.months, d.months);
            mergeArray(merged.addressPrefix, d.addressPrefix);
            mergeArray(merged.addressSuffix, d.addressSuffix);
            mergeArray(merged.addressPrefixCyrillic, d.addressPrefixCyrillic);
            mergeArray(merged.passport, d.passport);
            mergeArray(merged.dl, d.dl);
            mergeArray(merged.medical, d.medical);
            mergeArray(merged.bank, d.bank);
            mergeArray(merged.credentials, d.credentials);
            mergeArray(merged.commonNames, d.commonNames);
            mergeArray(merged.stopWords, d.stopWords);
            mergeArray(merged.cyrillicNames, d.cyrillicNames);
            mergeArray(merged.cyrillicStop, d.cyrillicStop);
            mergeArray(merged.nameIntro, d.nameIntro);
            mergeArray(merged.cyrillicIntro, d.cyrillicIntro);
            mergeArray(merged.honorifics, d.honorifics);
            mergeArray(merged.nameLabels, d.nameLabels);
            mergeArray(merged.surnames, d.surnames);
        }
        return merged;
    }

    // =========================================================================
    // getUILanguage() — Chrome auto-detected UI language (best-effort)
    // Returns a 2-letter code, or null when chrome.i18n is unavailable
    // (e.g. MAIN-world content scripts or the test environment).
    // =========================================================================
    function getUILanguage() {
        try {
            if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) {
                var full = chrome.i18n.getUILanguage(); // e.g. "pt-BR"
                if (full) return full.toLowerCase().split('-')[0];
            }
        } catch (e) { /* not available — fall through */ }
        return null;
    }

    // =========================================================================
    // getActiveLanguages() — language set used for detection
    // Always merges ALL supported languages so detection works for mixed or
    // unexpected content with no user setup. The Chrome UI language (when
    // detectable) is ordered first so its common-name lists take precedence.
    // =========================================================================
    function getActiveLanguages() {
        var ui = getUILanguage();
        if (ui && SUPPORTED.indexOf(ui) !== -1) {
            return [ui].concat(SUPPORTED.filter(function (l) { return l !== ui; }));
        }
        return SUPPORTED.slice();
    }

    window.__cloakerLocales = {
        DATA: DATA,
        SUPPORTED: SUPPORTED,
        build: build,
        getUILanguage: getUILanguage,
        getActiveLanguages: getActiveLanguages,
        // Pre-built merge of every supported language — what the engine consumes.
        merged: build(getActiveLanguages())
    };
})();
