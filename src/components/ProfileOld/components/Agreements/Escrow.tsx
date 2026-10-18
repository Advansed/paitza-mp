import { IonButton, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import React from 'react';


interface EcrowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EscrowAgreement: React.FC<EcrowProps> = ({isOpen, onClose}) => {
  return (
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Пользовательское соглашение</IonTitle>
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
  
              <div className="p-6 bg-white max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold">Приложение № 3</h1>
                  <p className="text-sm">к Пользовательскому соглашению.</p>
                  <h2 className="text-xl font-semibold mt-4">Договор эскроу</h2>
                </div>

                <div className="mb-6">
                  <p className="mb-4">
                    г. _______ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    « » ______ 20__ г.
                  </p>
                </div>

                <div className="mb-6 text-sm leading-relaxed">
                  <p className="mb-4">
                    <strong>ООО "Груз в рейс"</strong>, именуемое в дальнейшем "Эскроу-агент", 
                    в лице ген.директора Егорова Дмитрия Николаевича, действующей на основании Устава, 
                    с одной стороны,
                  </p>
                  <p className="mb-4">
                    ______________________, именуемое в дальнейшем "Заказчик", 
                    в лице ____________, действующего___ на основании ________, с другой стороны,
                  </p>
                  <p className="mb-4">
                    ______________________, именуемое в дальнейшем "Перевозчик", 
                    в лице ____________________, действующего на основании _______________, с третьей стороны,
                  </p>
                  <p>
                    Совместно именуемые "Стороны", заключили настоящий договор о нижеследующем:
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  {[
                    {
                      num: 1,
                      text: "В соответствии с настоящим договором Заказчик обязуется перечислить на депонирование Эскроу-агенту безналичные денежные средства в размере ____________________ рублей в целях исполнения обязательства Заказчика по Договору перевозки груза по заказу № _______________ от ___________ г., а Эскроу-агент обязуется обеспечить сохранность указанных безналичных денежных средств и перечислить их Перевозчику при возникновении указанных в настоящем договоре оснований."
                    },
                    {
                      num: 2,
                      text: "Срок депонирования денежных средств - 1 календарный год с даты поступления денежных средств на расчетный счет Эскроу-агента."
                    },
                    {
                      num: 3,
                      text: "Настоящий договор вступает в силу с момента поступления депонируемых денежных средств на расчетный счет Эскроу-агента и действует в течение 1 года."
                    },
                    {
                      num: 4,
                      text: "После перечисления депонируемых денежных средств на расчетный счет Эскроу-агента и в течение срока депонирования Эскроу-агент не вправе распоряжаться данными денежными средствами."
                    },
                    {
                      num: 7,
                      text: "Стоимость вознаграждения Эскроу-агента по настоящему договору составляет 3,8 % от стоимости депонируемых денежных средств, в том числе НДС."
                    },
                    {
                      num: 8,
                      text: "Обязательство по оплате вознаграждения Эскроу-агенту возложена на Заказчике, который обязуется перечислить сумму вознаграждения в день перечисления депонируемых денежных средств."
                    }
                  ].map(clause => (
                    <div key={clause.num} className="flex gap-3">
                      <span className="font-semibold">{clause.num}.</span>
                      <p className="flex-1 text-justify">{clause.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">ООО "Груз в рейс"</h3>
                      <div className="text-xs space-y-1">
                        <p>Адрес: г. Якутск, Чиряева 1 к 32</p>
                        <p>ИНН: 1435258769</p>
                        <p>Банк: ПАО «Промсвязьбанк»</p>
                        <p>К/с: 30101810700000000744</p>
                        <p>БИК: 040813744</p>
                        <p>Р/с: 40702810107000016356</p>
                      </div>
                      <p className="mt-4 text-sm">Ген. Директор &nbsp;&nbsp;&nbsp;&nbsp; Егоров Д.Н</p>
                    </div>
                  </div>
                </div>
              </div>

            </IonContent>
      </IonModal>
  );
};