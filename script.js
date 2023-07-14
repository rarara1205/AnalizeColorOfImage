import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// let rot = 0;

// レンダラーを作成
const canvasScene = document.querySelector("#canvasScene");
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvasScene,
});

// シーンを作成
const scene = new THREE.Scene();

// カメラを作成
const camera = new THREE.PerspectiveCamera(45, 1.0, 1, 5000);
camera.position.set(0, 0, +1000);

// カメラコントローラー作成
const controls = new OrbitControls(camera, canvasScene);
controls.enablePan = false;

// カメラを滑らかに
controls.enableDamping = true;
controls.dampingFactor = 0.2;

//ラジアン変換
// const radian = rot * Math.PI / 180;
// camera.position.x = 1000 * Math.sin(radian);
// camera.position.y = 1000 * Math.cos(radian);
//原点方向を見つめる
camera.lookAt(new THREE.Vector3(0,0,0));

// 箱を作成
// const geometry = new THREE.SphereGeometry(400, 50, 50);
// const material = new THREE.MeshStandardMaterial({color: 0xFF0000});
// const box = new THREE.Mesh(geometry, material);
// scene.add(box);

// 平行光源
// const directionalLight = new THREE.DirectionalLight(0xffffff);
// directionalLight.position.set(1, 1, 1);
// scene.add(directionalLight);

tick();

// 毎フレーム時に実行されるループイベントです
function tick() {
    controls.update();  // カメラコントローラー更新
    renderer.render(scene, camera); // レンダリング
    requestAnimationFrame(tick);
}

//初期化
onResize();
//リサイズ発生を検知
window.addEventListener("resize", onResize);

function onResize(){
    //サイズ取得
    const width = window.innerWidth/2;
    const height = window.innerHeight;

    //レンダラーのサイズ調整
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0xC0C0C0, 1);

    //カメラのアスペクト比調整
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}





// let image = document.getElementById("canvasImage");
let input = document.getElementById("inputImage");
let selectMode = document.getElementById("selectMode");
// let canvasImage = document.createElement("canvas");
let canvasImage = document.getElementById("canvasImage");
input.addEventListener("change", DisplayImage);
selectMode.addEventListener("change", CreatePoints);
canvasImage.addEventListener("click", Eyedropper);
let inputEyeDroppedColor = document.getElementById("inputEyedropedColor");
let buttonClearScene = document.getElementById("buttonClearScene");
buttonClearScene.addEventListener("click", ClickClearScene);
// canvasImage.addEventListener("wheel", Zoom);

let ctx = canvasImage.getContext("2d", {willReadFrequently: true});
let imageData = null;
let imageColors = [];
let imageSize = 0;
let colorItemSize = 0;
let image = new Image();
let particles = null;
const RADIUS = 200;
const theta = l => (1-l)*Math.PI;
const pointSize = 3.5;
let scale = 1;
let mode = selectMode.value;


window.onload = init();

function init(){
    CreatePoints();
}

function DisplayImage(){

    //ファイル読み込みクラス
    let reader = new FileReader();

    //読み込んだファイルのURLをresultに格納
    
    if(input.files[0] == null)  return;
    reader.readAsDataURL(input.files[0]);
    
    //読み込みが完了次第，画像のURLをsrcに格納して表示
    reader.onload = function(e){
        image.src = e.target.result;
        image.onload = function(){
            CreatePointsInit();
        }
    }
}

function rgb2hex(r,g,b){
    r = r.toString(16);
    if(r.length == 1) r = "0" + r;
    g = g.toString(16);
    if(g.length == 1) g = "0" + g;
    b = b.toString(16);
    if(b.length == 1) b = "0" + b;
    return "#"+r+g+b;
}

function Eyedropper(e){
    const [w,h] = [canvasImage.clientWidth, canvasImage.clientHeight];
    //マウス座標の取得
    mouseX = e.offsetX;
    mouseY = e.offsetY;
    //指定座標のImageDataオブジェクトの取得
    let dx = parseInt(lerp(0,image.width,mouseX/(w-1)));
    let dy = parseInt(lerp(0,image.height,mouseY/(h-1)));
    const imageData = ctx.getImageData(dx, dy, 1, 1);
    let r = imageData.data[0];
    let g = imageData.data[1];
    let b = imageData.data[2];
    inputEyeDroppedColor.value = rgb2hex(r,g,b);
    [r,g,b] = [r/255,g/255,b/255];
    
    let vertices = [r*RADIUS,g*RADIUS,b*RADIUS];
    if (mode == "HSL"){
        const [h,s,l] = rgb2hsl(r,g,b);
        vertices = [s*RADIUS*Math.sin(theta(l))*Math.cos(h),
            RADIUS*Math.cos(theta(l)),
            s*RADIUS*Math.sin(theta(l))*Math.sin(h)];
    }

    const colors = [r,g,b];    
    const sizes = [100];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    const pointTexture = new THREE.TextureLoader().load("disc.png");
    const material = new THREE.ShaderMaterial({
        uniforms:{
            pointTexture: {value: pointTexture}
        },
        vertexShader: document.getElementById("PointVertexShader").textContent,
        fragmentShader: document.getElementById("PointFragmentShader").textContent
    });
    const mesh = new THREE.Points(geometry, material);
    scene.add(mesh);
}

const MAX_SCALE = 5;
const SCALE_STEP = 0.2;
let imageScale = 1, imageScaleIndex = 0;
let mouseX, mouseY;
let zoomWidth, zoomHeight, zoomLeft=0, zoomTop=0;
// function Zoom(e){
//     mouseX = e.offsetX;
//     mouseY = e.offsetY;
//     if(e.wheelDelta > 0){
//         imageScaleIndex++;
//         imageScale = 1 + imageScaleIndex * SCALE_STEP;
//         if(imageScale > MAX_SCALE){
//             imageScale = MAX_SCALE;
//             imageScaleIndex--;
//         }
//         else {
//             zoomWidth = canvasImage.clientWidth / imageScale;
//             zoomHeight = canvasImage.clientHeight / imageScale;

//             zoomLeft += mouseX * SCALE_STEP / (imageScale * (imageScale - SCALE_STEP));
//             zoomLeft = Math.max(0, Math.min(canvasImage.clientWidth - zoomWidth, zoomLeft));

//             zoomTop += mouseY * SCALE_STEP / (imageScale * (imageScale - SCALE_STEP));
//             zoomTop = Math.max(0, Math.min(canvasImage.clientHeight - zoomHeight, zoomTop));
//         }
//     }
//     else {
//         imageScaleIndex--;
//         imageScale = 1 + imageScaleIndex * SCALE_STEP;
//         if(imageScale < 1){
//             imageScale = 1;
//             zoomLeft = 0;
//             zoomTop = 0;
//             imageScaleIndex = 0;
//         }
//         else{
//             zoomWidth = canvasImage.clientWidth / imageScale;
//             zoomHeight = 
//         }
//     }
//     ctx.clearRect(0, 0, e.target.width, e.target.height);
//     scale += e.deltaY * -0.001;
//     scale = Math.min(Math.max(0.5, scale), 2)
// }

function CheckFileExtension(fileName){
  return fileName.split(".").pop();
}

function CreatePointsInit(){
    const useAlphaChannel = CheckFileExtension(input.files[0].name) == "png" ? true : false;
    canvasImage.width = image.width;
    canvasImage.height = image.height;
    ctx.drawImage(image, 0, 0);
    imageData = ctx.getImageData(0, 0, image.width, image.height);
    imageSize = imageData.data.length;
    colorItemSize = useAlphaChannel ? 4 : 3;
    if(colorItemSize==4) console.log("画素数:"+imageSize/4);
    else  console.log("画素数:"+imageSize/3);
    CreatePoints();
}

function CreatePoints(){
    ClearScene();
    mode = selectMode.value;
    switch (mode){
        case "RGB":
            if(imageData == null){
                CreateRGBSample();
                break;
            }
            CreateRGBPoints();
            break;
        case "HSL":
            if(imageData == null){
                CreateHSLSample();
                break;
            }
            CreateHSLPoints();
            break;
    }
}

function ClickClearScene(){
    ClearScene();
    switch (mode){
        case "RGB":
            CreateAxisRGB();
            break;
        case "HSL":
            CreateAxisHSL();
            break;
    }
}

function ClearScene(){
    while(scene.children.length > 0){
        scene.remove(scene.children[0]);
    }
}

function CreateAxisRGB(){
    const geometry = new THREE.BoxGeometry(RADIUS*1.5, 1, 1);
    geometry.translate(RADIUS*1.5/2 + 0.5,0,0);
    const group = new THREE.Group();
    const materials = [new THREE.MeshBasicMaterial({color: 0xff0000}), 
                       new THREE.MeshBasicMaterial({color: 0x00ff00}), 
                       new THREE.MeshBasicMaterial({color: 0x0000ff}), ];
    for(let i=0; i<3; i++){    
        const mesh = new THREE.Mesh(geometry, materials[i]);
        mesh.rotation.z = i==1 ? Math.PI/2 : 0;
        mesh.rotation.y = i==2 ? -Math.PI/2 : 0;
        group.add(mesh);
    }
    
    scene.add(group);
}

function CheckIncludeColor(r,g,b){

}

function CreateRGBPoints(){
    CreateAxisRGB();
    // const boxes = [];
    const vertices = [];
    const colors = [];
    const sizes = [];
    for(let i=0; i<imageSize; i+=colorItemSize){
        // const geometry = new THREE.BoxGeometry(5, 5, 5);
        // const geometry = new THREE.BufferGeometry();
        let [r, g, b] = [imageData.data[i], imageData.data[i+1], imageData.data[i+2]];
        [r, g, b] = [r/255, g/255, b/255];
        // let colors = [];
        // for(let j=0, len = geometry.attributes.position.count*3; j<len; j+=3){
            // colors[j] = r;
            // colors[j+1] = g;
            // colors[j+2] = b;
        // }
        vertices.push(r*RADIUS,g*RADIUS,b*RADIUS);
        colors.push(r,g,b);
        sizes.push(pointSize);
        // geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        // const geometryTrans = geometry.translate(r*RADIUS, g*RADIUS, b*RADIUS);
        // boxes.push(geometryTrans);
        // boxes.push(geometry);
        // colors = [];
    }
    // const geometries = BufferGeometryUtils.mergeGeometries(boxes);
    // console.log(count);
    // console.log(geometries.attributes.position.count);
    // const material = new THREE.RawShaderMaterial({
    //     vertexShader: document.getElementById("RGBvertexShader").textContent,
    //     fragmentShader: document.getElementById("RGBfragmentShader").textContent
    // });
    // const material = new THREE.MeshBasicMaterial({
    //     vertexColors: true
    // });
    // const mesh = new THREE.Mesh(geometries, material);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    const pointTexture = new THREE.TextureLoader().load("disc.png");
    const material = new THREE.ShaderMaterial({
        uniforms:{
            pointTexture: {value: pointTexture}
        },
        vertexShader: document.getElementById("PointVertexShader").textContent,
        fragmentShader: document.getElementById("PointFragmentShader").textContent
    });
    const mesh = new THREE.Points(geometry, material);
    scene.add(mesh);
}



function CreateHSLPoints(){
    // const boxes = [];
    CreateAxisHSL();
    const vertices = [];
    const colors = [];
    // const RGB = [];
    const sizes = [];
    for(let i=0; i<imageSize; i+=colorItemSize){
        // const geometry = new THREE.BoxGeometry(5, 5, 5);
        let [r, g, b] = [imageData.data[i], imageData.data[i+1], imageData.data[i+2]];
        [r, g, b] = [r/255, g/255, b/255];
        // const geometryTrans = geometry.translate(
        //         s*RADIUS*Math.sin(theta(l))*Math.cos(h),
        //         RADIUS*Math.cos(theta(l)),
        //         s*RADIUS*Math.sin(theta(l))*Math.sin(h)
        // );
        // boxes.push(geometryTrans);
        // let colors = [];
        // for(let j=0, len = geometry.attributes.position.count*3; j<len; j+=3){
        //     colors[j] = r;
        //     colors[j+1] = g;
        //     colors[j+2] = b;
        // }
        // geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        // const colorIndex = ArraysIncludes(RGB, [r,g,b]);
        // console.log(colorIndex);
        // if(colorIndex == -1){        
            const [h, s, l] = rgb2hsl(r,g,b);
            // RGB.push([r,g,b]);
            colors.push(r,g,b);
            vertices.push(
                s*RADIUS*Math.sin(theta(l))*Math.cos(h),
                RADIUS*Math.cos(theta(l)),
                s*RADIUS*Math.sin(theta(l))*Math.sin(h)
            );
            sizes.push(pointSize);
        // }
        // else{
        //     sizes[colorIndex] += 0.1;
        // }
    }
    // const geometries = BufferGeometryUtils.mergeGeometries(boxes);
    // const material = new THREE.MeshBasicMaterial({
    //     vertexColors: true
    // });
    // const mesh = new THREE.Mesh(geometries, material);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    const pointTexture = new THREE.TextureLoader().load("disc.png");
    const material = new THREE.ShaderMaterial({
        uniforms:{
            pointTexture: {value: pointTexture}
        },
        vertexShader: document.getElementById("PointVertexShader").textContent,
        fragmentShader: document.getElementById("PointFragmentShader").textContent
    });
    const mesh = new THREE.Points(geometry, material);
    scene.add(mesh);
}
// h:色相 s:彩度 l:輝度
function CreateAxisHSL(){
    const vertices = [];
    const colors = [];
    const sizes = [];
    for(let r=0; r<256; r+=51){
        for(let g=0; g<256; g+=51){
            for(let b=0; b<256; b+=51){
                const [R, G, B] = [r/255, g/255, b/255];
                let [h, s, l] = rgb2hsl(R,G,B);
                if(s>=0){
                    colors.push(R,G,B);
                    vertices.push(
                        s*RADIUS*Math.sin(theta(l))*Math.cos(h),
                        RADIUS*Math.cos(theta(l)),
                        s*RADIUS*Math.sin(theta(l))*Math.sin(h)
                    );
                    sizes.push(20);
                }
            }
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    const pointTexture = new THREE.TextureLoader().load("disc.png");
    const material = new THREE.ShaderMaterial({
        uniforms:{
            pointTexture: {value: pointTexture}
        },
        vertexShader: document.getElementById("PointVertexShader").textContent,
        fragmentShader: document.getElementById("PointFragmentShader").textContent
    });
    const mesh = new THREE.Points(geometry, material);

    scene.add(mesh);
}

function rgb2hsl (r, g, b) {
	let max = Math.max( r, g, b ) ;
	let min = Math.min( r, g, b ) ;
	let diff = max - min ;

	let h = 0 ;
	let s = (diff == 0) ? 0 : diff / (1-(Math.abs(max + min - 1)));
	let l = (max + min) / 2;

	switch(min){
		case max:
			h = 0 ;
		    break ;
		case r:
			h = (60 * ((b - g) / diff)) + 180 ;
		    break ;
		case g:
			h = (60 * ((r - b) / diff)) + 300 ;
		    break;
		case b:
			h = (60 * ((g - r) / diff)) + 60 ;
		    break ;
	}

    h = h * (Math.PI/180);

	return [h, s, l] ;
}

function lerp (a, b, p){
    return a + (b - a)*p;
}

function CreateRGBSample(){
    CreateAxisRGB();
    const vertices = [];
    const colors = [];
    const sizes = [];
    for(let r=0; r<256; r+=15){
        for(let g=0; g<256; g+=15){
            for(let b=0; b<256; b+=15){
                // const geometry = new THREE.BoxGeometry(5, 5, 5);
                const [R, G, B] = [r/255, g/255, b/255];
                // for(let j=0, len = geometry.attributes.position.count*3; j<len; j+=3){
                //     colors[j] = R;
                //     colors[j+1] = G;
                //     colors[j+2] = B;
                // }
                // geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                // const geometryTrans = geometry.translate(RADIUS*R,RADIUS*G,RADIUS*B);
                // boxes.push(geometryTrans);
                colors.push(R,G,B);
                vertices.push(RADIUS*R,RADIUS*G,RADIUS*B);
                sizes.push(Math.floor(Math.random()*(10-1)+1));
            }
        }
    }
    // const geometries = BufferGeometryUtils.mergeGeometries(boxes);
    // const material = new THREE.MeshBasicMaterial({
    //     vertexColors: true
    // });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    const pointTexture = new THREE.TextureLoader().load("disc.png");
    const material = new THREE.ShaderMaterial({
        uniforms:{
            pointTexture: {value: pointTexture}
        },
        vertexShader: document.getElementById("PointVertexShader").textContent,
        fragmentShader: document.getElementById("PointFragmentShader").textContent
    });
    const mesh = new THREE.Points(geometry, material);
    scene.add(mesh);
}

function CreateHSLSample(){
    CreateAxisHSL();
    const vertices = [];
    const colors = [];
    const sizes = [];
    for(let r=0; r<256; r+=15){
        for(let g=0; g<256; g+=15){
            for(let b=0; b<256; b+=15){
                // const geometry = new THREE.BoxGeometry(5, 5, 5);
                const [R, G, B] = [r/255, g/255, b/255];
                let [h, s, l] = rgb2hsl(R,G,B);
                // const rad = RADIUS;
                // const theta = (1-l) * Math.PI;
                // const phi = h;
                // let colors = [];
                // for(let j=0, len = geometry.attributes.position.count*3; j<len; j+=3){
                //     colors[j] = R;
                //     colors[j+1] = G;
                //     colors[j+2] = B;
                // }
                // geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                // const geometryTrans = geometry.translate(
                //         s*rad*Math.sin(theta)*Math.cos(phi),
                //         rad*Math.cos(theta),
                //         s*rad*Math.sin(theta)*Math.sin(phi));
                // boxes.push(geometryTrans);
                colors.push(R,G,B);
                vertices.push(
                    s*RADIUS*Math.sin(theta(l))*Math.cos(h),
                    RADIUS*Math.cos(theta(l)),
                    s*RADIUS*Math.sin(theta(l))*Math.sin(h)
                );
                sizes.push(Math.floor(Math.random()*(10-1)+1));
            }
        }
    }
    // const geometries = BufferGeometryUtils.mergeGeometries(boxes);
    // const material = new THREE.MeshBasicMaterial({
    //     vertexColors: true
    // });
    // const mesh = new THREE.Mesh(geometries, material);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    const pointTexture = new THREE.TextureLoader().load("disc.png");
    const material = new THREE.ShaderMaterial({
        uniforms:{
            pointTexture: {value: pointTexture}
        },
        vertexShader: document.getElementById("PointVertexShader").textContent,
        fragmentShader: document.getElementById("PointFragmentShader").textContent
    });
    const mesh = new THREE.Points(geometry, material);

    scene.add(mesh);
}

function ArrayEqual(a = [], b = []){
    return a.toString() == b.toString(); 
}

function ArraysIncludes(arrays = [], array = []){
    for(let i=0, len=arrays.length; i<len; i++){
        if(ArrayEqual(arrays[i], array)){
            return i;
        }
    }
    return -1;
}
