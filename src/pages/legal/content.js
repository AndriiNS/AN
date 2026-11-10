// Texts of the Impressum and the privacy policy in three languages.
// The German version is the legally binding one; EN and UK are translations.
//
// IMPORTANT: this is a careful template for a small personal portfolio
// (static site on Cloudflare Pages, no cookies, no analytics, no forms).
// It is not legal advice. If you add analytics, a contact form, embedded
// videos or fonts from Google, the privacy policy must be extended.
// You can cross-check it with a generator such as e-recht24.de.
import { AUTHORITY, HOSTING, IMPRINT } from '../../data/site';

// A paragraph is a string or a list of parts; a part with href becomes a link.
const link = (text, href) => ({ text, href });

const address = [IMPRINT.name, IMPRINT.street, IMPRINT.city, IMPRINT.country];

const contactLines = (emailLabel, phoneLabel) => [
  [`${emailLabel}: `, link(IMPRINT.email, `mailto:${IMPRINT.email}`)],
  ...(IMPRINT.phone ? [[`${phoneLabel}: `, link(IMPRINT.phone, `tel:${IMPRINT.phone.replace(/\s/g, '')}`)]] : []),
];

export const LEGAL = {
  de: {
    imprint: {
      title: 'Impressum',
      sections: [
        { h: 'Angaben gemäß § 5 DDG', lines: address },
        { h: 'Kontakt', lines: contactLines('E-Mail', 'Telefon') },
        {
          h: 'Haftung für Links',
          p: [
            'Diese Website enthält Links zu externen Websites Dritter (zum Beispiel GitHub und LinkedIn), auf deren Inhalte ich keinen Einfluss habe. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werde ich derartige Links umgehend entfernen.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Datenschutzerklärung',
      sections: [
        {
          h: '1. Verantwortlicher',
          p: ['Verantwortlich für die Datenverarbeitung auf dieser Website ist:'],
          lines: [...address, ...contactLines('E-Mail', 'Telefon')],
        },
        {
          h: '2. Das Wichtigste in Kürze',
          p: [
            'Diese Website ist ein persönliches Portfolio. Sie setzt keine Cookies, verwendet keine Analyse- oder Tracking-Werkzeuge und hat kein Kontaktformular. Schriftarten und alle anderen Dateien werden direkt von dieser Website geladen, es werden keine Inhalte von Drittanbietern eingebunden.',
          ],
        },
        {
          h: '3. Hosting und Server-Logfiles',
          p: [
            `Diese Website wird bei ${HOSTING.name} gehostet. Anbieter ist ${HOSTING.company}. Beim Aufruf der Website verarbeitet der Anbieter automatisch Daten, die Ihr Browser übermittelt: IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, Referrer-URL sowie Browser und Betriebssystem. Diese Daten sind technisch nötig, um die Website auszuliefern und ihre Sicherheit zu gewährleisten.`,
            'Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Mein berechtigtes Interesse liegt in einer sicheren und zuverlässigen Bereitstellung der Website.',
            'Dabei können Daten in die USA übermittelt werden. Die Übermittlung stützt sich auf den Angemessenheitsbeschluss der EU-Kommission zum EU-US Data Privacy Framework, soweit der Anbieter danach zertifiziert ist, und im Übrigen auf Standardvertragsklauseln (Art. 46 DSGVO).',
            ['Weitere Informationen: ', link(`Datenschutzerklärung von ${HOSTING.provider}`, HOSTING.privacyUrl)],
          ],
        },
        {
          h: '4. Kontakt per E-Mail',
          p: [
            'Wenn Sie mir eine E-Mail schreiben, verarbeite ich Ihre E-Mail-Adresse und den Inhalt Ihrer Nachricht, um Ihre Anfrage zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn es um eine Stelle oder ein Projekt geht, sonst Art. 6 Abs. 1 lit. f DSGVO. Ich lösche die Daten, sobald sie für die Bearbeitung nicht mehr nötig sind und keine gesetzlichen Aufbewahrungspflichten bestehen.',
          ],
        },
        {
          h: '5. Links zu anderen Websites',
          p: [
            'Links zu GitHub und LinkedIn sind einfache Verweise. Erst wenn Sie einen solchen Link anklicken, werden Daten an den jeweiligen Anbieter übertragen. Dafür gilt dessen Datenschutzerklärung.',
          ],
        },
        {
          h: '6. Ihre Rechte',
          p: [
            'Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21). Schreiben Sie mir dazu einfach eine E-Mail.',
            'Außerdem können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO). Für mich zuständig ist:',
          ],
          lines: [AUTHORITY.name, AUTHORITY.address, [link(AUTHORITY.url.replace('https://', ''), AUTHORITY.url)]],
        },
      ],
    },
  },

  en: {
    imprint: {
      title: 'Imprint',
      sections: [
        { h: 'Information according to § 5 DDG (German Digital Services Act)', lines: address },
        { h: 'Contact', lines: contactLines('Email', 'Phone') },
        {
          h: 'Liability for links',
          p: [
            'This website links to external websites (for example GitHub and LinkedIn). I have no influence on their content; the respective provider is always responsible for it. If I learn that a linked page breaks the law, I will remove the link immediately.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy policy',
      sections: [
        {
          h: '1. Controller',
          p: ['The person responsible for data processing on this website is:'],
          lines: [...address, ...contactLines('Email', 'Phone')],
        },
        {
          h: '2. In short',
          p: [
            'This website is a personal portfolio. It sets no cookies, uses no analytics or tracking tools and has no contact form. Fonts and all other files are loaded from this website itself; no third-party content is embedded.',
          ],
        },
        {
          h: '3. Hosting and server log files',
          p: [
            `This website is hosted on ${HOSTING.name}, provided by ${HOSTING.company}. When you open the website, the provider automatically processes data your browser sends: IP address, date and time of access, requested page, referrer URL, browser and operating system. This is technically required to deliver the website and keep it secure.`,
            'The legal basis is Art. 6(1)(f) GDPR. My legitimate interest is a secure and reliable website.',
            'Data may be transferred to the USA. The transfer is based on the European Commission’s adequacy decision for the EU-US Data Privacy Framework where the provider is certified under it, and otherwise on standard contractual clauses (Art. 46 GDPR).',
            ['More information: ', link(`${HOSTING.provider} privacy policy`, HOSTING.privacyUrl)],
          ],
        },
        {
          h: '4. Contact by email',
          p: [
            'If you email me, I process your email address and the content of your message to answer you. The legal basis is Art. 6(1)(b) GDPR when it is about a job or a project, otherwise Art. 6(1)(f) GDPR. I delete the data once it is no longer needed and no legal retention period applies.',
          ],
        },
        {
          h: '5. Links to other websites',
          p: [
            'Links to GitHub and LinkedIn are plain links. Data is sent to these providers only when you click one; their privacy policies then apply.',
          ],
        },
        {
          h: '6. Your rights',
          p: [
            'You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and to object to processing based on Art. 6(1)(f) GDPR (Art. 21). Just send me an email.',
            'You can also lodge a complaint with a data protection authority (Art. 77 GDPR). The authority responsible for me is:',
          ],
          lines: [AUTHORITY.name, AUTHORITY.address, [link(AUTHORITY.url.replace('https://', ''), AUTHORITY.url)]],
        },
      ],
    },
  },

  uk: {
    imprint: {
      title: 'Impressum (вихідні дані)',
      sections: [
        { h: 'Відомості відповідно до § 5 DDG (закон Німеччини про цифрові послуги)', lines: address },
        { h: 'Контакти', lines: contactLines('Email', 'Телефон') },
        {
          h: 'Відповідальність за посилання',
          p: [
            'Цей сайт містить посилання на сторонні сайти (наприклад, GitHub і LinkedIn). Я не впливаю на їхній зміст, за нього завжди відповідає власник відповідного сайту. Якщо я дізнаюся, що сторінка за посиланням порушує закон, я одразу приберу посилання.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Політика конфіденційності',
      sections: [
        {
          h: '1. Відповідальна особа',
          p: ['За обробку даних на цьому сайті відповідає:'],
          lines: [...address, ...contactLines('Email', 'Телефон')],
        },
        {
          h: '2. Коротко',
          p: [
            'Цей сайт — особисте портфоліо. Він не встановлює cookies, не використовує аналітику чи трекінг і не має контактної форми. Шрифти та всі інші файли завантажуються з самого сайту, сторонній вміст не вбудовується.',
          ],
        },
        {
          h: '3. Хостинг і журнали сервера',
          p: [
            `Сайт розміщено на ${HOSTING.name}, постачальник — ${HOSTING.company}. Коли ви відкриваєте сайт, постачальник автоматично обробляє дані, які передає ваш браузер: IP-адресу, дату й час доступу, відкриту сторінку, адресу, з якої ви прийшли, браузер і операційну систему. Це технічно потрібно, щоб показати сайт і захистити його.`,
            'Правова підстава — ст. 6(1)(f) GDPR. Мій законний інтерес — безпечна й надійна робота сайту.',
            'Дані можуть передаватися до США. Передача ґрунтується на рішенні Єврокомісії про адекватність щодо EU-US Data Privacy Framework, якщо постачальник має таку сертифікацію, а в інших випадках — на стандартних договірних положеннях (ст. 46 GDPR).',
            ['Докладніше: ', link(`політика конфіденційності ${HOSTING.provider}`, HOSTING.privacyUrl)],
          ],
        },
        {
          h: '4. Листування електронною поштою',
          p: [
            'Якщо ви пишете мені листа, я обробляю вашу адресу й текст повідомлення, щоб відповісти. Правова підстава — ст. 6(1)(b) GDPR, якщо йдеться про вакансію чи проєкт, інакше ст. 6(1)(f) GDPR. Я видаляю дані, коли вони більше не потрібні і немає обов’язку їх зберігати за законом.',
          ],
        },
        {
          h: '5. Посилання на інші сайти',
          p: [
            'Посилання на GitHub і LinkedIn — звичайні посилання. Дані передаються цим сервісам лише тоді, коли ви натискаєте посилання, і тоді діє їхня політика конфіденційності.',
          ],
        },
        {
          h: '6. Ваші права',
          p: [
            'Ви маєте право на доступ до даних (ст. 15 GDPR), виправлення (ст. 16), видалення (ст. 17), обмеження обробки (ст. 18), перенесення даних (ст. 20) і заперечення проти обробки на підставі ст. 6(1)(f) GDPR (ст. 21). Для цього просто напишіть мені листа.',
            'Ви також можете подати скаргу до органу із захисту даних (ст. 77 GDPR). Для мене компетентний орган:',
          ],
          lines: [AUTHORITY.name, AUTHORITY.address, [link(AUTHORITY.url.replace('https://', ''), AUTHORITY.url)]],
        },
      ],
    },
  },
};

