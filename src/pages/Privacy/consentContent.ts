import { privacyLocale, type PrivacyDocumentContent } from './privacyContent'
import type { AppLocale } from '../../i18n'

const ru: PrivacyDocumentContent = {
  kicker: 'PAITZA',
  title: 'Согласие на обработку персональных данных',
  meta: [
    { label: 'Дата документа', value: '25 сентября 2026 года' },
    {
      label: 'Оператор',
      value:
        'Общество с ограниченной ответственностью «Пайцза КейДжи» (ОсОО «Пайцза КейДжи»), Кыргызская Республика.',
    },
    { label: 'Контакт', value: 'paitza.group@gmail.com' },
  ],
  notice:
    'Важно: для электронной формы на сайте необходимо отдельно настроить действие согласия, не отмеченный заранее флажок, ссылку на Политику конфиденциальности и журналирование акцепта. Этот документ не заменяет техническую реализацию.',
  sections: [
    {
      heading: '1. Общие положения',
      paragraphs: [
        '1.1. Настоящее Согласие определяет условия, на которых субъект персональных данных выражает согласие на обработку своих персональных данных оператором PAITZA в случаях, когда такое согласие требуется применимым законодательством.',
        '1.2. Согласие применяется совместно с Политикой конфиденциальности PAITZA, Пользовательским соглашением, Публичной офертой и условиями конкретной функции.',
        '1.3. Согласие не заменяет иные законные основания обработки, которые могут применяться независимо от согласия, например необходимость исполнения договора или выполнения обязательной юридической обязанности.',
        '1.4. Согласие должно предоставляться свободно, конкретно, информированно и однозначно. Пользователь должен иметь возможность ознакомиться с Политикой конфиденциальности до предоставления согласия.',
      ],
    },
    {
      heading: '2. Оператор и контакты',
      paragraphs: [
        '2.1. Оператор: Общество с ограниченной ответственностью «Пайцза КейДжи», сокращённо — ОсОО «Пайцза КейДжи», Кыргызская Республика.',
        '2.2. Юридический адрес: Кыргызская Республика, г. Бишкек, Ленинский район, ул. Проектируемая (с. Ново-Павловка), д. 221.',
        '2.3. Контакт для вопросов и отзывов согласия: paitza.group@gmail.com.',
      ],
    },
    {
      heading: '3. Категории данных',
      paragraphs: [
        '3.1. В зависимости от роли и функции могут обрабатываться: имя и фамилия; наименование организации; должность и полномочия; телефон и электронная почта; сведения об аккаунте; документы личности или организации, если они необходимы; сведения о транспортном средстве и водительских документах; сведения о грузе, маршруте и заказе; документы перевозки; фотографии и видеозаписи; статусы расчётов; технические журналы и сведения о безопасности.',
        '3.2. Конкретные поля данных определяются регистрационной формой, функцией Платформы и документами, доступными пользователю до предоставления данных.',
        '3.3. Оператор не должен запрашивать данные, не относящиеся к заявленной цели обработки, без отдельного законного основания.',
      ],
    },
    {
      heading: '4. Цели обработки',
      paragraphs: [
        '4.1. Регистрация пользователя, создание и обслуживание аккаунта.',
        '4.2. Проверка личности, полномочий, документов и соответствия требованиям доступа к определённым функциям.',
        '4.3. Размещение, согласование, исполнение и отслеживание логистических заказов, взаимодействие участников перевозки и обмен связанными документами.',
        '4.4. Фиксация загрузки, выгрузки, доставки, претензий и событий заказа.',
        '4.5. Сопровождение расчётов, комиссии, обеспечительного баланса, возвратов и взаимодействия с уполномоченными платёжными организациями.',
        '4.6. Защита аккаунтов, предотвращение мошенничества, поддержка пользователей, техническая диагностика и безопасность сервиса.',
        '4.7. Выполнение юридических обязанностей, рассмотрение обращений, защита прав и законных интересов в допустимом законом объёме.',
      ],
    },
    {
      heading: '5. Действия с данными и получатели',
      paragraphs: [
        '5.1. В зависимости от цели данные могут собираться, записываться, систематизироваться, храниться, уточняться, использоваться, передаваться, обезличиваться, блокироваться или удаляться в объёме, разрешённом применимым законодательством.',
        '5.2. Данные могут передаваться участникам конкретного заказа, техническим подрядчикам, поставщикам хостинга и программных сервисов, банкам и платёжным организациям, профессиональным консультантам и компетентным органам при наличии законного основания и в необходимом объёме.',
        '5.3. При международной перевозке отдельные сведения могут передаваться за пределы страны, если это необходимо для исполнения заказа и допускается применимым законодательством о трансграничной передаче данных.',
        '5.4. Оператор не должен продавать персональные данные как самостоятельный товар.',
      ],
    },
    {
      heading: '6. Сроки хранения',
      paragraphs: [
        '6.1. Данные хранятся в течение срока, необходимого для заявленных целей, исполнения договоров, завершения заказов и расчётов, рассмотрения претензий, выполнения требований закона и защиты прав.',
        '6.2. После достижения целей данные удаляются, обезличиваются или архивируются с ограничением доступа, если продолжение хранения не требуется законом или для защиты прав.',
        '6.3. Точные сроки зависят от категории данных и должны определяться Политикой конфиденциальности и внутренним регламентом хранения данных Оператора.',
      ],
    },
    {
      heading: '7. Права субъекта и отзыв согласия',
      paragraphs: [
        '7.1. Субъект данных может в пределах применимого законодательства запросить доступ к данным, исправление неточных сведений, удаление или ограничение обработки, а также отозвать согласие, если обработка основана на согласии.',
        '7.2. Отзыв согласия не делает незаконной обработку, выполненную до его получения. Он также не препятствует обработке на другом законном основании, если такое основание существует.',
        '7.3. Отзыв согласия может повлиять на возможность пользоваться функциями, для которых соответствующие данные необходимы.',
        '7.4. Для отзыва согласия или реализации прав необходимо написать на paitza.group@gmail.com. Оператор может запросить разумное подтверждение личности или полномочий заявителя.',
        '7.5. Запрос рассматривается в сроки и порядке, установленные применимым законодательством. Если отказ или ограничение ответа допускаются законом, Оператор сообщает причину в разрешённом объёме.',
      ],
    },
    {
      heading: '8. Трансграничная передача и защита',
      paragraphs: [
        '8.1. Если данные передаются в другую страну, Оператор должен определить цель, получателя, категории данных и применимое правовое основание такой передачи.',
        '8.2. Оператор применяет организационные и технические меры защиты, соразмерные характеру данных и рискам, а также требования законодательства, применимые к конкретной передаче.',
        '8.3. Пользователь не должен предоставлять данные третьих лиц без законного основания и необходимых уведомлений или согласий.',
      ],
    },
    {
      heading: '9. Порядок предоставления согласия',
      paragraphs: [
        '9.1. Согласие предоставляется отдельным действием в интерфейсе, например установкой неотмеченного заранее флажка и нажатием кнопки подтверждения, либо иным способом, допускаемым законом.',
        '9.2. Интерфейс должен позволять пользователю увидеть текст согласия и Политику конфиденциальности до подтверждения.',
        '9.3. Оператор фиксирует факт согласия, дату и время, идентификатор пользователя, редакцию текста и иные необходимые технические сведения, если это допускается законом.',
        '9.4. Согласие не должно объединяться с рекламными согласиями или другими необязательными целями таким образом, чтобы пользователь не мог свободно выбрать каждую из них, когда раздельное согласие требуется законом.',
      ],
    },
    {
      heading: '10. Заключительные положения',
      paragraphs: [
        '10.1. Настоящее Согласие действует в пределах указанных целей и до отзыва либо прекращения соответствующего основания обработки, если более длительное хранение или обработка не требуется законом.',
        '10.2. Если отдельное положение Согласия признаётся недействительным, остальные положения сохраняют силу в пределах, допускаемых законом.',
        '10.3. Оператор: ОсОО «Пайцза КейДжи», Кыргызская Республика.',
        '10.4. Юридический адрес: Кыргызская Республика, г. Бишкек, Ленинский район, ул. Проектируемая (с. Ново-Павловка), д. 221.',
        '10.5. Контакт: paitza.group@gmail.com.',
      ],
    },
    {
      heading: '11. Подтверждение субъекта данных',
      paragraphs: [
        '11.1. Я подтверждаю, что ознакомился(лась) с Политикой конфиденциальности PAITZA и понимаю цели и основные условия обработки персональных данных, указанные в настоящем Согласии.',
        '11.2. Я предоставляю согласие на обработку моих персональных данных в объёме и для целей, указанных в настоящем документе, в случаях, когда такое согласие требуется применимым законодательством.',
        '11.3. Я понимаю, что могу отозвать согласие в порядке, описанном выше, с учётом возможных последствий для функций, требующих соответствующих данных.',
      ],
    },
  ],
  closing: [
    'Способ подтверждения в электронной форме: отдельный флажок согласия и кнопка подтверждения. Флажок не должен быть установлен заранее.',
    'Имя / наименование пользователя: __________________________________________',
    'Дата и время подтверждения (фиксируются системой): __________________________',
  ],
  end: 'Конец документа',
  footer: 'PAITZA • Согласие на обработку персональных данных • 25.09.2026',
}

const en: PrivacyDocumentContent = {
  kicker: 'PAITZA',
  title: 'Consent to the Processing of Personal Data',
  meta: [
    { label: 'Document date', value: '25 September 2026' },
    {
      label: 'Operator',
      value: 'Paitza KG Limited Liability Company (OsOO “Paitza KG”), Kyrgyz Republic.',
    },
    { label: 'Contact', value: 'paitza.group@gmail.com' },
  ],
  notice:
    'Important: the website’s electronic form must implement a separate consent action, an unchecked-by-default checkbox, a link to the Privacy Policy, and acceptance logging. This document does not replace the technical implementation.',
  sections: [
    {
      heading: '1. General provisions',
      paragraphs: [
        '1.1. This Consent sets out the terms on which the data subject consents to PAITZA’s processing of personal data where consent is required by applicable law.',
        '1.2. This Consent applies together with the PAITZA Privacy Policy, User Agreement, Public Offer and terms of the relevant feature.',
        '1.3. This Consent does not replace other lawful grounds for processing that may apply independently of consent, including processing necessary to perform a contract or comply with a legal obligation.',
        '1.4. Consent must be freely given, specific, informed and unambiguous. The user must be able to review the Privacy Policy before giving consent.',
      ],
    },
    {
      heading: '2. Operator and contact details',
      paragraphs: [
        '2.1. Operator: Paitza KG Limited Liability Company (OsOO “Paitza KG”), Kyrgyz Republic.',
        '2.2. Registered address: 221 Proektiruemaya Street (Novo-Pavlovka village), Leninsky District, Bishkek, Kyrgyz Republic.',
        '2.3. Contact for questions and withdrawal of consent: paitza.group@gmail.com.',
      ],
    },
    {
      heading: '3. Categories of data',
      paragraphs: [
        '3.1. Depending on the user’s role and the feature used, data may include: first and last name; organization name; position and authority; telephone number and email address; account information; identity or organization documents where necessary; vehicle and driver documents; cargo, route and order information; transport documents; photographs and video recordings; settlement statuses; technical logs and security information.',
        '3.2. Specific data fields are determined by the registration form, Platform feature and documents made available to the user before data is provided.',
        '3.3. The Operator must not request data unrelated to the stated processing purpose without a separate lawful basis.',
      ],
    },
    {
      heading: '4. Purposes of processing',
      paragraphs: [
        '4.1. User registration, account creation and account servicing.',
        '4.2. Verification of identity, authority, documents and eligibility to access particular features.',
        '4.3. Posting, agreeing, performing and tracking logistics orders; communication between transport participants; and exchange of related documents.',
        '4.4. Recording loading, unloading, delivery, claims and order-related events.',
        '4.5. Administering settlements, commissions, security balances, refunds and interactions with authorized payment organizations.',
        '4.6. Account protection, fraud prevention, user support, technical diagnostics and service security.',
        '4.7. Compliance with legal obligations, handling requests, and protecting rights and legitimate interests to the extent permitted by law.',
      ],
    },
    {
      heading: '5. Data operations and recipients',
      paragraphs: [
        '5.1. Depending on the purpose, data may be collected, recorded, organized, stored, updated, used, transferred, anonymized, blocked or deleted to the extent permitted by applicable law.',
        '5.2. Data may be disclosed to participants in a particular order, technical contractors, hosting and software service providers, banks and payment organizations, professional advisers and competent authorities where there is a lawful basis and only to the necessary extent.',
        '5.3. For international transportation, certain information may be transferred outside the country where necessary to perform the order and permitted by applicable cross-border data transfer laws.',
        '5.4. The Operator must not sell personal data as a standalone commodity.',
      ],
    },
    {
      heading: '6. Retention periods',
      paragraphs: [
        '6.1. Data is retained for as long as necessary for the stated purposes, performance of contracts, completion of orders and settlements, handling claims, compliance with legal requirements and protection of rights.',
        '6.2. Once the purposes have been fulfilled, data is deleted, anonymized or archived with restricted access unless further retention is required by law or for the protection of rights.',
        '6.3. Exact retention periods depend on the data category and must be specified in the Privacy Policy and the Operator’s internal data-retention rules.',
      ],
    },
    {
      heading: '7. Data subject rights and withdrawal of consent',
      paragraphs: [
        '7.1. To the extent provided by applicable law, the data subject may request access to data, correction of inaccurate information, deletion or restriction of processing, and may withdraw consent where processing is based on consent.',
        '7.2. Withdrawal does not make processing carried out before receipt of the withdrawal unlawful. It also does not prevent processing under another lawful basis, where one exists.',
        '7.3. Withdrawal may affect the ability to use features for which the relevant data is necessary.',
        '7.4. To withdraw consent or exercise rights, write to paitza.group@gmail.com. The Operator may request reasonable proof of the requester’s identity or authority.',
        '7.5. Requests are handled within the time limits and according to the procedure established by applicable law. Where the law permits a refusal or limitation, the Operator will state the reason to the extent permitted.',
      ],
    },
    {
      heading: '8. Cross-border transfers and protection',
      paragraphs: [
        '8.1. Where data is transferred to another country, the Operator must identify the purpose, recipient, data categories and applicable legal basis for the transfer.',
        '8.2. The Operator applies organizational and technical safeguards proportionate to the nature of the data and the risks, together with legal requirements applicable to the particular transfer.',
        '8.3. Users must not provide third-party data without a lawful basis and any required notices or consents.',
      ],
    },
    {
      heading: '9. How consent is given',
      paragraphs: [
        '9.1. Consent is given through a separate action in the interface, such as ticking a checkbox that is not preselected and clicking a confirmation button, or by another method permitted by law.',
        '9.2. Before confirmation, the interface must allow the user to view this Consent and the Privacy Policy.',
        '9.3. The Operator records the fact of consent, date and time, user identifier, text version and other necessary technical information where permitted by law.',
        '9.4. Consent must not be bundled with marketing consent or other optional purposes in a way that prevents the user from freely choosing each purpose where separate consent is required by law.',
      ],
    },
    {
      heading: '10. Final provisions',
      paragraphs: [
        '10.1. This Consent applies to the stated purposes until it is withdrawn or the relevant lawful basis for processing ends, unless longer retention or processing is required by law.',
        '10.2. If any provision of this Consent is held invalid, the remaining provisions remain effective to the extent permitted by law.',
        '10.3. Operator: OsOO “Paitza KG”, Kyrgyz Republic.',
        '10.4. Registered address: 221 Proektiruemaya Street (Novo-Pavlovka village), Leninsky District, Bishkek, Kyrgyz Republic.',
        '10.5. Contact: paitza.group@gmail.com.',
      ],
    },
    {
      heading: '11. Data subject confirmation',
      paragraphs: [
        '11.1. I confirm that I have read the PAITZA Privacy Policy and understand the purposes and principal terms of personal data processing set out in this Consent.',
        '11.2. I consent to the processing of my personal data to the extent and for the purposes specified in this document where such consent is required by applicable law.',
        '11.3. I understand that I may withdraw my consent using the procedure described above, subject to possible consequences for features that require the relevant data.',
      ],
    },
  ],
  closing: [
    'Electronic confirmation method: a separate consent checkbox and confirmation button. The checkbox must not be preselected.',
    'User name / organization name: __________________________________________',
    'Date and time of confirmation (recorded by the system): __________________________',
  ],
  end: 'End of document',
  footer: 'PAITZA • Consent to the Processing of Personal Data • 25.09.2026',
}

const zh: PrivacyDocumentContent = {
  kicker: 'PAITZA',
  title: '个人数据处理同意书',
  meta: [
    { label: '文件日期', value: '2026年9月25日' },
    { label: '运营方', value: '吉尔吉斯共和国有限责任公司“Paitza KG”（ОсОО «Пайцза КейДжи»）。' },
    { label: '联系方式', value: 'paitza.group@gmail.com' },
  ],
  notice:
    '重要提示：网站电子表单应设置独立的同意操作、默认不勾选的复选框、隐私政策链接，并记录同意行为。本文件不能替代必要的技术实施。',
  sections: [
    {
      heading: '1. 总则',
      paragraphs: [
        '1.1. 本同意书规定了在适用法律要求取得同意的情况下，个人数据主体同意 PAITZA 运营方处理其个人数据的条件。',
        '1.2. 本同意书应与 PAITZA《隐私政策》《用户协议》《公开要约》以及相关功能的具体条款一并适用。',
        '1.3. 本同意书不取代其他可独立适用的合法处理依据，例如为履行合同或履行法定义务所必需的处理。',
        '1.4. 同意必须基于自愿、具体、知情且明确的意思表示。用户应能够在作出同意前查阅《隐私政策》。',
      ],
    },
    {
      heading: '2. 运营方及联系方式',
      paragraphs: [
        '2.1. 运营方：吉尔吉斯共和国有限责任公司“Paitza KG”（ОсОО «Пайцза КейДжи»）。',
        '2.2. 注册地址：吉尔吉斯共和国比什凯克市列宁区，Proektiruemaya 街 221 号（Novo-Pavlovka 村）。',
        '2.3. 咨询及撤回同意的联系方式：paitza.group@gmail.com。',
      ],
    },
    {
      heading: '3. 个人数据类别',
      paragraphs: [
        '3.1. 根据用户角色和所使用的功能，可能处理以下数据：姓名；组织名称；职务及权限；电话号码和电子邮箱；账户信息；必要时的身份证明或组织文件；车辆及驾驶员文件；货物、路线和订单信息；运输文件；照片和视频记录；结算状态；技术日志及安全信息。',
        '3.2. 具体数据字段由注册表单、平台功能以及用户提交数据前可查阅的文件确定。',
        '3.3. 如无单独的合法依据，运营方不得要求提供与所声明处理目的无关的数据。',
      ],
    },
    {
      heading: '4. 处理目的',
      paragraphs: [
        '4.1. 用户注册、创建账户及账户维护。',
        '4.2. 核验身份、权限、文件以及使用特定功能的资格。',
        '4.3. 发布、协商、履行和跟踪物流订单；促进运输参与方之间的沟通；交换相关文件。',
        '4.4. 记录装货、卸货、交付、索赔及订单相关事件。',
        '4.5. 管理结算、佣金、保证余额、退款以及与获授权支付机构的沟通。',
        '4.6. 保护账户、防范欺诈、提供用户支持、进行技术诊断并保障服务安全。',
        '4.7. 在法律允许的范围内履行法定义务、处理请求并保护权利及合法利益。',
      ],
    },
    {
      heading: '5. 数据处理操作及接收方',
      paragraphs: [
        '5.1. 根据处理目的，数据可在适用法律允许的范围内被收集、记录、整理、存储、更新、使用、传输、匿名化、限制处理或删除。',
        '5.2. 在具有合法依据且限于必要范围的情况下，数据可提供给具体订单的参与方、技术承包商、托管及软件服务提供商、银行和支付机构、专业顾问及主管机关。',
        '5.3. 对于国际运输，如履行订单确有必要且适用的跨境数据传输法律允许，部分信息可能被传输至其他国家。',
        '5.4. 运营方不得将个人数据作为独立商品出售。',
      ],
    },
    {
      heading: '6. 保存期限',
      paragraphs: [
        '6.1. 数据保存期限以实现所述目的、履行合同、完成订单和结算、处理索赔、遵守法律要求及保护权利所必需的期限为限。',
        '6.2. 达到处理目的后，除法律或权利保护另有要求外，数据将被删除、匿名化，或在限制访问的条件下归档保存。',
        '6.3. 具体保存期限取决于数据类别，并应由《隐私政策》及运营方内部数据保存规则确定。',
      ],
    },
    {
      heading: '7. 数据主体权利及撤回同意',
      paragraphs: [
        '7.1. 在适用法律规定的范围内，数据主体可以请求访问数据、更正不准确的信息、删除数据或限制处理；如处理依据为同意，也可以撤回同意。',
        '7.2. 撤回同意不影响撤回前已进行的合法处理，也不妨碍在存在其他合法依据时继续依据该依据处理数据。',
        '7.3. 撤回同意可能影响用户使用必须依赖相关数据的功能。',
        '7.4. 如需撤回同意或行使相关权利，请发送邮件至 paitza.group@gmail.com。运营方可合理要求申请人证明其身份或权限。',
        '7.5. 请求将按照适用法律规定的期限和程序处理。如法律允许拒绝或限制答复，运营方将在法律允许的范围内说明理由。',
      ],
    },
    {
      heading: '8. 跨境传输与保护',
      paragraphs: [
        '8.1. 如将数据传输至其他国家，运营方应明确传输目的、接收方、数据类别及适用的合法依据。',
        '8.2. 运营方将根据数据性质和风险采取相称的组织及技术保护措施，并遵守适用于具体传输的法律要求。',
        '8.3. 用户不得在缺乏合法依据或未履行必要告知、未取得必要同意的情况下提供第三方个人数据。',
      ],
    },
    {
      heading: '9. 同意的提供方式',
      paragraphs: [
        '9.1. 用户应通过界面中的独立操作提供同意，例如勾选默认未选中的复选框并点击确认按钮，或采用法律允许的其他方式。',
        '9.2. 在确认前，界面必须允许用户查看本同意书及《隐私政策》。',
        '9.3. 在法律允许的情况下，运营方记录同意事实、日期和时间、用户标识、文本版本及其他必要的技术信息。',
        '9.4. 在法律要求分别取得同意时，不得将本同意与营销同意或其他可选目的捆绑，以致用户无法自由选择是否同意各项目的。',
      ],
    },
    {
      heading: '10. 最终条款',
      paragraphs: [
        '10.1. 本同意书在所述目的范围内有效，直至同意被撤回或相关处理的合法依据终止；法律要求更长时间保存或处理的除外。',
        '10.2. 如本同意书的任何条款被认定为无效，其余条款在法律允许的范围内继续有效。',
        '10.3. 运营方：吉尔吉斯共和国有限责任公司“Paitza KG”（ОсОО «Пайцза КейДжи»）。',
        '10.4. 注册地址：吉尔吉斯共和国比什凯克市列宁区，Proektiruemaya 街 221 号（Novo-Pavlovka 村）。',
        '10.5. 联系方式：paitza.group@gmail.com。',
      ],
    },
    {
      heading: '11. 数据主体确认',
      paragraphs: [
        '11.1. 本人确认已阅读 PAITZA《隐私政策》，并理解本同意书所列个人数据处理目的及主要条件。',
        '11.2. 在适用法律要求取得同意的情况下，本人同意按照本文件所述范围和目的处理本人的个人数据。',
        '11.3. 本人理解可按照上述程序撤回同意，并知悉这可能影响需要使用相关数据的功能。',
      ],
    },
  ],
  closing: [
    '电子确认方式：使用独立的同意复选框和确认按钮。该复选框不得预先勾选。',
    '用户姓名／组织名称：__________________________________________',
    '确认日期和时间（由系统记录）：__________________________',
  ],
  end: '文件结束',
  footer: 'PAITZA • 个人数据处理同意书 • 25.09.2026',
}

const DOCUMENTS: Record<AppLocale, PrivacyDocumentContent> = { ru, en, zh }

export function consentDocument(language: string | undefined): PrivacyDocumentContent {
  return DOCUMENTS[privacyLocale(language)]
}
