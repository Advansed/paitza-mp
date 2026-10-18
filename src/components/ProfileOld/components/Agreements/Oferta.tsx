import { IonButton, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}
const Oferta: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('settings');
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
              <IonHeader>
                <IonToolbar>
                  <IonTitle>{t('licenseAgreement')}</IonTitle>
                  <IonButton 
                    fill="clear" 
                    slot="end" 
                    onClick={onClose}
                  >
                    <IonIcon icon={closeOutline} />
                  </IonButton>
                </IonToolbar>
              </IonHeader>
              
              <IonContent className="ion-padding">
                <div className="max-w-4xl mx-auto p-6 bg-white">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">ЛИЦЕНЗИОННОЕ СОГЛАШЕНИЕ ДЛЯ ПЛАТФОРМЫ "ГРУЗ В РЕЙС"</h1>
                    <p className="text-gray-600">08.08.2025</p>
                  </div>

                  <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">1. ПРЕАМБУЛА</h2>
                    
                    <div className="mb-4">
                      <p className="mb-2"><strong>1.1.</strong> Настоящее Лицензионное соглашение (далее – «Соглашение») регулирует отношения между:</p>
                      <ul className="ml-6 mb-4">
                        <li className="mb-2">
                          <strong>Лицензиар:</strong> Обществом с ограниченной ответственностью «ГрузВРейс» (ГВР), являющимся правообладателем программного комплекса «Груз в рейс» (далее – «Платформа»), расположенным по адресу:<br />
                          Юридический и почтовый адреса: 677000, Республика Саха (Якутия), г. Якутск, ул. Чиряева, д. 1, кв. 32. ИНН: 1435258769, ОГРН: 1121435012577
                        </li>
                        <li>
                          <strong>Лицензиат:</strong> Любым физическим или юридическим лицом, прошедшим процедуру регистрации и акцептовавшим условия настоящего Соглашения (далее – «Пользователь»)
                        </li>
                      </ul>
                    </div>

                    <p className="mb-4"><strong>1.2.</strong> Платформа представляет собой программно-аппаратный комплекс, предназначенный для автоматизации поиска заказчиков и исполнителей в сфере грузоперевозок на территории Российской Федерации, организации и обеспечения сделок между ними.</p>
                    
                    <p className="mb-4"><strong>1.3.</strong> Акцептом (принятием) условий настоящего Соглашения считается совершение Пользователем конклюдентных действий, направленных на использование функционала Платформы, включая, но не ограничиваясь: прохождение процедуры регистрации, использование веб-интерфейса или мобильного приложения.</p>
                    
                    <p className="mb-4"><strong>1.4.</strong> Настоящее Соглашение является неотъемлемой частью пакета документов, регулирующих использование Платформы.</p>
                  </section>

                  <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">2. ОСНОВНЫЕ РАЗДЕЛЫ СОГЛАШЕНИЯ</h2>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <span className="mr-2">🔐</span> 2.1. ПРАВА И ОГРАНИЧЕНИЯ
                      </h3>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.1.1. Предоставляемые права:</h4>
                        <ul className="ml-6 space-y-2">
                          <li>Лицензиар предоставляет Пользователю на условиях простой (неисключительной) лицензии право использования Платформы «Груз в рейс» на территории Российской Федерации</li>
                          <li>Право использования реализуется исключительно в функциональных целях Платформы через предоставленный веб-интерфейс и/или мобильное приложение</li>
                          <li>Пользователь имеет право на получение информационной и технической поддержки</li>
                        </ul>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.1.2. Ограничения:</h4>
                        <ul className="ml-6 space-y-2">
                          <li>Запрещается декомпилировать, дизассемблировать, модифицировать, взламывать или иным образом пытаться извлечь исходный код Платформы</li>
                          <li>Запрещается создавать копии, производные произведения на основе Платформы</li>
                          <li>Запрещается использовать Платформу в коммерческих целях, не предусмотренных ее прямым функционалом</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <span className="mr-2">👥</span> 2.2. ТИПЫ ПОЛЬЗОВАТЕЛЕЙ И ИХ СТАТУС
                      </h3>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.2.1. Заказчик:</h4>
                        <p className="mb-2">Заказчиком признается физическое или юридическое лицо, использующее Платформу для поиска и найма Исполнителей с целью перевозки грузов.</p>
                        <p>Заказчик несет полную ответственность за достоверность предоставляемых данных о грузе и финансовую ответственность за убытки, вызванные недостоверной информацией.</p>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.2.2. Перевозчик (Водитель/Исполнитель):</h4>
                        <p className="mb-2">Перевозчиком признается физическое или юридическое лицо, оказывающее услуги по перевозке грузов на профессиональной основе.</p>
                        <p>Перевозчик обязан подтвердить свою квалификацию и несет ответственность за сохранность принятого к перевозке груза.</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <span className="mr-2">💰</span> 2.3. ФИНАНСОВЫЕ УСЛОВИЯ
                      </h3>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.3.1. Комиссия Платформы:</h4>
                        <p>За использование Платформы Лицензиар удерживает комиссию в размере от 5% до 10% от суммы каждой успешной сделки.</p>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.3.2. Способы расчетов:</h4>
                        <ul className="ml-6 space-y-2">
                          <li><strong>Безналичный расчет:</strong> через систему безопасных платежей Платформы с использованием специального счета (эскроу)</li>
                          <li><strong>Наличный расчет:</strong> между сторонами напрямую (Платформа не несет ответственности за проведение платежа)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <span className="mr-2">🛡️</span> 2.4. СИСТЕМА ГАРАНТИЙ И СТРАХОВАНИЯ
                      </h3>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.4.1. Уровни ответственности:</h4>
                        <ul className="ml-6 space-y-2">
                          <li><strong>Уровень 0 (Прямые расчеты):</strong> Расчеты напрямую, риски несут стороны самостоятельно</li>
                          <li><strong>Уровень 1 (Частичная гарантия):</strong> Предоплата 50%, возмещение в пределах заблокированной суммы</li>
                          <li><strong>Уровень 2 (Полная гарантия):</strong> Предоплата 100%, полное возмещение ущерба в пределах суммы сделки</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <span className="mr-2">📸</span> 2.5. ДАННЫЕ И КОНФИДЕНЦИАЛЬНОСТЬ
                      </h3>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.5.1. Сбор данных:</h4>
                        <p className="mb-2">Для использования Платформы собираются следующие данные:</p>
                        <ul className="ml-6 space-y-1">
                          <li>Персональные данные (ФИО, паспортные данные, контакты)</li>
                          <li>Данные о грузах и перевозках</li>
                          <li>Геолокационные данные</li>
                          <li>Фото и видео материалы</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">2.5.2. Использование данных:</h4>
                        <p>Данные используются для обеспечения функционирования Платформы, связи с Пользователем, проведения аналитики и обеспечения безопасности.</p>
                      </div>
                    </div>
                  </section>

                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Полные условия использования и дополнительные регламенты изложены в соответствующих документах Платформы.
                    </p>
                  </div>
                </div>
            </IonContent>
        </IonModal>
    
  );
};

export default Oferta;