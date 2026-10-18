import React, { useState } from "react";
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { cameraOutline, closeOutline, sendOutline } from "ionicons/icons";
import { jsPDF } from "jspdf";
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { IonButton, IonChip, IonIcon, IonLoading, IonModal } from "@ionic/react";
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { RenderCurrentScaleProps, RenderZoomInProps, RenderZoomOutProps, zoomPlugin } from '@react-pdf-viewer/zoom';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import styles from './DataEditor/fields/ImageField.module.css';
import { compressImageDataUrl, formatFileSize, getDataUrlSize } from '../utils/fileUpload';
import UTIF from 'utif';

defineCustomElements(window)

function stripBase64Payload(raw: string): string {
  const comma = raw.indexOf(',');
  if (raw.startsWith('data:') && comma >= 0) return raw.slice(comma + 1);
  return raw;
}

function normalizeCapturedPhoto(
  base64OrDataUrl: string,
  formatHint?: string
): { base64: string; format: string; dataUrl: string } {
  const header = base64OrDataUrl.startsWith('data:')
    ? base64OrDataUrl.split(',')[0]
    : '';
  const headerFormat = header.match(/image\/([a-zA-Z0-9+.-]+)/i)?.[1];
  const rawFormat = (headerFormat || formatHint || 'jpeg').toLowerCase().replace('jpg', 'jpeg');
  const format = ['png', 'webp', 'gif', 'heic', 'heif', 'jpeg', 'bmp'].includes(rawFormat)
    ? rawFormat
    : 'jpeg';
  const base64 = stripBase64Payload(base64OrDataUrl).replace(/\s/g, '');
  return {
    base64,
    format,
    dataUrl: `data:image/${format};base64,${base64}`,
  };
}

async function finalizeCapturedPhoto(
  base64OrDataUrl: string,
  formatHint?: string
): Promise<{ base64: string; format: string; dataUrl: string }> {
  const normalized = normalizeCapturedPhoto(base64OrDataUrl, formatHint);
  const received = getDataUrlSize(normalized.dataUrl);
  const dataUrl = await compressImageDataUrl(normalized.dataUrl);
  const format = dataUrl.startsWith('data:image/webp') ? 'webp' : 'jpeg';
  return normalizeCapturedPhoto(dataUrl, format);
}

/** Web fallback: file input (camera capture on mobile browsers) */
function pickImageFromFileInput(): Promise<{
  base64: string;
  format: string;
  dataUrl: string;
} | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // Prefer rear camera on mobile browsers when available
    input.setAttribute('capture', 'environment');
    input.style.display = 'none';
    document.body.appendChild(input);

    const cleanup = () => {
      input.remove();
    };

    input.onchange = async () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const dataUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(String(reader.result));
          reader.onerror = () => rej(reader.error);
          reader.readAsDataURL(file);
        });
        resolve(await finalizeCapturedPhoto(dataUrl, file.type.split('/')[1]));
      } catch {
        resolve(null);
      }
    };

    input.oncancel = () => {
      cleanup();
      resolve(null);
    };

    input.click();
  });
}

export async function takePicture() {
    if (!Capacitor.isNativePlatform()) {
        return pickImageFromFileInput();
    }

    try {
        const image = await Camera.getPhoto({
            quality:        80,
            allowEditing:   false,
            resultType:     CameraResultType.Base64,
            source:         CameraSource.Prompt,
            width:          600,
            height:         800,
            correctOrientation: true,
        });

        if (!image || !image.base64String) {
            return null;
        }

        // WebView после системной камеры ещё без сети — чуть подождать до upload
        await new Promise((resolve) => window.setTimeout(resolve, 400));

        return finalizeCapturedPhoto(image.base64String, image.format);
    } catch (error) {
        console.error("Camera error:", error);
        // Fallback to file input if Camera plugin fails in hybrid webview
        return pickImageFromFileInput();
    }
}


export async function takePicture_(): Promise<{ format: string; dataUrl: string } | null> {
  return new Promise((resolve) => {
    // Создаем модальное окно для камеры
    const cameraModal = document.createElement('div');
    cameraModal.className = styles.cameraPreview;
    
    let currentStream: MediaStream | null = null;
    let facingMode: 'user' | 'environment' = 'environment';

    const startCamera = async () => {
      try {
        // Останавливаем предыдущий поток
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
          video: { 
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream;
        
        const video = cameraModal.querySelector('video');
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
      } catch (error) {
        console.error("Camera error:", error);
        // Пробуем переключиться на другую камеру при ошибке
        if (facingMode === 'environment') {
          facingMode = 'user';
          startCamera();
        } else {
          removeCameraModal();
          resolve(null);
        }
      }
    };

    const capturePhoto = () => {
      const video = cameraModal.querySelector('video');
      if (!video) return;

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Для фронтальной камеры зеркалим изображение
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        removeCameraModal();
        resolve({
          format: 'jpeg',
          dataUrl
        });
      } else {
        removeCameraModal();
        resolve(null);
      }
    };

    const switchCamera = () => {
      facingMode = facingMode === 'user' ? 'environment' : 'user';
      updateCameraButtonText();
      startCamera();
    };

    const removeCameraModal = () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (document.body.contains(cameraModal)) {
        document.body.removeChild(cameraModal);
      }
    };

    const updateCameraButtonText = () => {
      const switchButton = cameraModal.querySelector('#switchCamera span');
      if (switchButton) {
        switchButton.textContent = facingMode === 'user' ? 'Задняя' : 'Передняя';
      }
    };

    // Создаем интерфейс камеры
    cameraModal.innerHTML = `
      <div class="${styles.cameraHeader}">
        <div class="${styles.cameraControls}">
          <div class="${styles.cameraLeftControls}">
            <button class="${styles.cameraButton}" id="closeCamera">
              <ion-icon name="close-outline"></ion-icon>
              <span>Отмена</span>
            </button>
          </div>
          
          <div class="${styles.cameraTitle}">Камера</div>
          
          <div class="${styles.cameraRightControls}">
            <button class="${styles.cameraButton}" id="switchCamera">
              <ion-icon name="camera-reverse-outline"></ion-icon>
              <span>Передняя</span>
            </button>
            <button class="${styles.captureButton}" id="capturePhoto" title="Сделать фото">
              <ion-icon name="aperture-outline"></ion-icon>
            </button>
          </div>
        </div>
      </div>
      <div class="${styles.cameraBody}">
        <video class="${styles.cameraVideo}" autoplay playsinline muted></video>
      </div>
    `;

    document.body.appendChild(cameraModal);

    // Инициализируем Ionic icons
    const icons = cameraModal.querySelectorAll('ion-icon');
    icons.forEach(icon => {
      const iconName = icon.getAttribute('name');
      if (iconName) {
        const svgIcon = document.createElement('div');
        svgIcon.innerHTML = getIconSvg(iconName);
        icon.parentNode?.replaceChild(svgIcon.firstChild!, icon);
      }
    });

    // Добавляем обработчики событий
    cameraModal.querySelector('#capturePhoto')?.addEventListener('click', capturePhoto);
    cameraModal.querySelector('#switchCamera')?.addEventListener('click', switchCamera);
    cameraModal.querySelector('#closeCamera')?.addEventListener('click', () => {
      removeCameraModal();
      resolve(null);
    });

    // Запускаем камеру
    startCamera();
    updateCameraButtonText();
  });
}

// Функция для получения SVG иконок
function getIconSvg(iconName: string): string {
  const icons: { [key: string]: string } = {
    'close-outline': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="20" height="20" fill="currentColor"><path d="M289.94,256l95-95A24,24,0,0,0,351,127l-95,95-95-95A24,24,0,0,0,127,161l95,95-95,95A24,24,0,1,0,161,385l95-95,95,95A24,24,0,0,0,385,351Z"/></svg>',
    'camera-reverse-outline': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="20" height="20" fill="currentColor"><path d="M432,144H373.55L356,124.1A64.07,64.07,0,0,0,304,96H208a64.07,64.07,0,0,0-52,28.1L138.45,144H80a64.07,64.07,0,0,0-64,64V368a64.07,64.07,0,0,0,64,64H432a64.07,64.07,0,0,0,64-64V208A64.07,64.07,0,0,0,432,144ZM448,368a16,16,0,0,1-16,16H80a16,16,0,0,1-16-16V208A16,16,0,0,1,80,192h80a16,16,0,0,0,13-6.67L191,156.2a32.06,32.06,0,0,1,26-13.2h96a32.06,32.06,0,0,1,26,13.2l18,29.13A16,16,0,0,0,352,192h80a16,16,0,0,1,16,16Z"/><path d="M256,272a64,64,0,1,0,64,64A64.07,64.07,0,0,0,256,272Zm0,96a32,32,0,1,1,32-32A32,32,0,0,1,256,368Z"/></svg>',
    'aperture-outline': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24" height="24" fill="currentColor"><path d="M256,64C150,64,64,150,64,256s86,192,192,192,192-86,192-192S362,64,256,64Z" style="fill:none;stroke:currentColor;stroke-miterlimit:10;stroke-width:32px"/><path d="M360,144l-84.38,84.38"/><path d="M228,112L132,204"/><path d="M264,172l116-116"/><path d="M336,328l-84.38-84.38"/><path d="M284,400l-96-92"/><path d="M248,340L132,456"/></svg>'
  };
  
  return icons[iconName] || '';
}

export async function   toPDF( pages, name ) {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    for(let i = 0; i < pages.length; i++){
        const img = new Image();
        img.src = pages[i].dataUrl;
        await img.decode();
        let wt = img.width;
        let ht = img.height; 

        let k = 1
        if(wt > 1000) k = 1000 / wt
        if(ht > 1000 && (1000 / ht) < k) k = 1000 / ht


        wt = Math.floor(wt * k)
        ht = Math.floor(ht * k)

        const canvas = document.createElement("canvas");
            
        const ctx = canvas.getContext("2d");

        canvas.width = wt;
        canvas.height = ht;
            
        ctx?.drawImage(img, 0, 0, wt, ht);

            // Show resized image in preview element
        const dataurl = canvas.toDataURL( 'image/jpeg' );
            
        k = wt /210
        if( ht / 297 > k ) k = ht / 297

        if(i > 0) doc.addPage();

        doc.addImage( dataurl, "jpeg", 0, 0, Math.floor(wt / k), Math.floor(ht / k) );

    }

    return doc.output("datauristring",{ filename: name})
}

export async function   toTIFF(pages, name) {
  if (!pages.length) return null;
    const imageBuffers: any = [];

    for(const page of pages) {
        const img = new Image();
        img.src = page.dataUrl;
        await img.decode();
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        
        if(ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            imageBuffers.push({
                width:          img.width,
                height:         img.height,
                data:           new Uint8Array(imageData.data.buffer),
                compression:    1, // JPEG сжатие
                quality:        90 // Качество JPEG 0-100
            });
        }
    }

    if(imageBuffers.length === 0) return '';

    const tiffBuffer = UTIF.encodeImages(imageBuffers);
    return "data:image/tiff;base64," + btoa(String.fromCharCode(...tiffBuffer));
}

export async function   fromTIFF(tiffDataUrl) {
    try {
        // Удаляем префикс data:image/tiff;base64,
        const base64Data = tiffDataUrl.split(',')[1];
        const arrayBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Декодируем TIFF
        const ifds = UTIF.decode(arrayBuffer);
        const images:any = [];
        
        for(let i = 0; i < ifds.length; i++) {
            const ifd = ifds[i];
            
            // Декодируем данные изображения
            UTIF.decodeImage(arrayBuffer, ifd);
            
            // Создаем canvas для конвертации в dataUrl
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if(ctx){
                canvas.width = ifd.width;
                canvas.height = ifd.height;
                
                // Создаем ImageData из декодированных данных
                const imageData = ctx.createImageData(ifd.width, ifd.height);
                imageData.data.set(new Uint8ClampedArray(ifd.data));
                
                // Рисуем на canvas
                ctx.putImageData(imageData, 0, 0);
                
                // Получаем dataUrl
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                
                images.push({
                    dataUrl: dataUrl,
                    format: 'jpeg',
                    width: ifd.width,
                    height: ifd.height,
                    page: i + 1
                });
            }
        }
        
        return images;
    } catch (error) {
        console.error('Ошибка извлечения из TIFF:', error);
        return [];
    }
}

export function         PDFDoc( props ){
    const [ pages ] = useState<any>(1)
    const [ page, setPage ] = useState(1)
    const [ message, setMessage ] = useState("")

    const zoomPluginInstance = zoomPlugin();
    const { CurrentScale, ZoomIn, ZoomOut } = zoomPluginInstance;

    const base64toBlob = (data: string) => {
        
        const jarr = data.split(",")

        const base64WithoutPrefix = jarr[1] //data.substr('data:application/pdf;base64,'.length);
    
        const bytes = atob(base64WithoutPrefix);

        let length = bytes.length;
        const out = new Uint8Array(length);
    
        while (length--) {
            out[length] = bytes.charCodeAt(length);
        }
    
        return new Blob([out], { type: 'application/pdf' });
    };

    const blob = base64toBlob( props.url );
    const url = URL.createObjectURL(blob);

    return <>
        <div className="h-3 pl-2 w-100 bg-2 flex">
            <div>PDF view</div>
            <div className="ml-1">
                <ZoomOut>
                    {(props: RenderZoomOutProps) => (
                        <IonButton
                            onClick={props.onClick}
                        >
                            -
                        </IonButton>
                    )}
                </ZoomOut>
            </div>
            <div className="ml-1">
                <CurrentScale>
                    {(props: RenderCurrentScaleProps) => <>{`${Math.round(props.scale * 100)}%`}</>}
                </CurrentScale>
            </div>
            <div className="ml-1">
                <ZoomIn>
                    {(props: RenderZoomInProps) => (
                        <IonButton
                            onClick={props.onClick}
                        >
                            +
                        </IonButton>
                    )}
                </ZoomIn>
            </div>
            <div className="ml-1">
                <IonButton
                    /* eslint-disable */
                    onClick={()=>{ 
                        if(props.onClose)
                            props.onClose()
                    }}
                ><IonIcon icon = { closeOutline }/></IonButton>
            </div>
        </div>
        <p className="m-stack fs-bold fs-2 cl-prim">{ message }</p>
        <div className="scroll"> 
            {/* <Viewer fileUrl={ url } plugins={ [ zoomPluginInstance ] } /> */}
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.js">
                <div>
                    <Viewer
                        fileUrl={ url }
                        plugins={[
                            zoomPluginInstance,
                        ]}
                    />
                </div>
            </Worker>
        </div>
    </>
}

export function         Files(props: { info, name, check, title }) {
    const [ upd,    setUpd] = useState( 0 )
    const [ modal,  setModal] = useState<any>() // eslint-disable-line @typescript-eslint/no-explicit-any
    const [ modal1, setModal1] = useState( false )
    const [ load ] = useState( false)

    async function getFoto(){
        try {
            const imageUrl = await takePicture();

            if(imageUrl) {
                if(imageUrl.format === "pdf") props.info.length = 0
                else if( props.info.length > 0 && props.info[0].format === "pdf" ) props.info.length = 0

                props.info.push( imageUrl )
            }
                
        } catch (error) {
            console.error( error )
        }
        setUpd(upd + 1)   
    }

    async function openPDF(){
        try {
            if (!Capacitor.isNativePlatform()) {
                const file = await new Promise<File | null>((resolve) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'application/pdf';
                    input.style.display = 'none';
                    document.body.appendChild(input);
                    input.onchange = () => {
                        const f = input.files?.[0] || null;
                        input.remove();
                        resolve(f);
                    };
                    input.oncancel = () => {
                        input.remove();
                        resolve(null);
                    };
                    input.click();
                });
                if (!file) return;
                const dataUrl = await new Promise<string>((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = () => res(String(reader.result));
                    reader.onerror = () => rej(reader.error);
                    reader.readAsDataURL(file);
                });
                props.info.length = 0;
                props.info.push({ dataUrl, format: 'pdf' });
                setUpd(upd + 1);
                return;
            }

            const res = await FilePicker.pickFiles({types: ['application/pdf'], readData: true})

            if(res.files[0]?.data){
                props.info.length = 0
                props.info.push( { dataUrl: "data:application/pdf;base64," + res.files[0]?.data, format: 'pdf'})
                setUpd(upd + 1)
            }

        } catch (error) {
            console.error( error )
        }

    }
    
    async function PDF(){

        const pdf = await toPDF( props.info,  props.name + ".pdf")

        props.info.length = 0;
        props.info.push( { dataUrl: pdf, format: "pdf" } )
        setUpd( upd + 1 )
    }

    const elem = <>
        <div>
            <div className="flex fl-space t-underline ml-1 mr-1 fs-09">
                <div className= { props.check ? "mr-1" : "mr-1" }>
                    { props.check ? " * " + props.title : props.title }
                </div>
            </div>
                
            <div className={ "flex fl-wrap" }>

                { props.info.map((e, ind) =>{
                    return e.format === "pdf"
                        ? <img key = { ind as number } src = { "assets/pdf.png" } alt="" className="w-4 h-4 ml-1 mt-1 s-point"
                            onClick = {()=>{ setModal( e );  }}
                        />
                        : <img key = { ind as number } src = { e.dataUrl } alt="" className="w-4 h-4 ml-1 mt-1 s-point"
                            onClick = {()=>{ setModal( e );  }}
                        />
                        
                    })}
                    
                <div
                    onClick={()=>{ setModal1( true ) }}
                    className="ml-1 mt-1 s-photo"
                >
                    <IonIcon icon = { cameraOutline } color="warning" slot="icon-only" className="w-3 h-3 "/>
                </div>                        

            </div>
        </div> 
        <IonLoading isOpen = { load } message = "Подождите..."/>
        <IonModal
            className="w-100 h-100"
            isOpen = { modal !== undefined }
            onDidDismiss={ () => setModal( undefined )}
        >
            <div className="w-100 h-100">
                {  
                    modal?.format === "pdf" 
                        ? <PDFDoc url = { modal?.dataUrl } name  = { props.name } title = { props.title }/>
                        : <img src={ modal?.dataUrl } alt = "" />
                }
            </div>
        </IonModal>
        <IonModal
            className="w-100 h-100"
            isOpen = { modal1 }
            onDidDismiss={ () => setModal1( false )}
        >
            <div className="w-100 h-100">
                <div className="ml-1 mt-1 mr-1 cl-prim fs-09">
                    { props.title }
                </div>
                <div className="ml-1 mt-1 mr-1 cl-prim">
                    <div className="flex fl-space fs-09">
                        <div>
                            <b>Прикрепите заранее подготовленный pdf-файл</b>
                        </div>
                        <img src="assets/addPDF1.png" alt="addPDF" className="s-photo-3"/>
                    </div>
                    <div className="flex fl-space fs-09">
                        <div className="mt-05">
                            <b>или сфотографируйте все страницы документа</b>
                        </div>
                        <div className="s-photo-3">
                            <IonIcon icon = { cameraOutline } color="warning" slot="icon-only" className="w-2 h-2 "/>
                        </div>
                    </div>
                </div>
                <div className="flex fl-wrap">
                    <img key = { 100 } src = "assets/addPDF1.png" alt="pdf"  className="ml-1 s-photo-1 mt-1"
                        onClick={()=>{
                            openPDF()
                            setModal1( false )
                        }}              
                    />
                    <div
                        onClick={()=>{ 
                            getFoto() 
                        }}
                        className="ml-1 mt-1 s-photo"
                    >
                        <IonIcon icon = { cameraOutline } color="warning" slot="icon-only" className="w-3 h-3 "/>
                    </div>   
                    <div
                        onClick={()=>{ 
                            props.info.pop();    
                            setUpd(upd + 1)
                        }}
                        className="ml-1 mt-1 s-photo"
                    >
                        <img src="assets/delFile.png" alt="delFile"  className="w-3 h-3"/>
                    </div>   
                </div>
                <div className="ml-1 mt-1 mr-1 cl-prim">
                </div>
                <div className="flex fl-wrap">
                    { props.info.map((e, ind) =>{
                        return e.format === "pdf"
                            ? <img key = { ind as number } src = { "assets/pdf.png" } alt="" className="w-4 h-4 ml-1 mt-1 s-point"
                                onClick = {()=>{ setModal( e ) }}
                            />
                            : <img key = { ind as number } src = { e.dataUrl } alt="" className="w-4 h-4 ml-1 mt-1 s-point"
                                onClick = {()=>{ setModal( e ) }}
                            />
                            
                        })
                    }
                </div>
                <div className="ml-1 mt-1 mr-1">
                    <IonButton
                        expand = "block"
                        onClick={()=>{ 
                            if(props.info.length > 1 )
                                PDF()
                            setModal1( false )}
                        }
                    >
                        Закрыть
                    </IonButton>
                </div>
            </div>
        </IonModal>

    </>
    return elem
}
