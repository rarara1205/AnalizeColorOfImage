import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

let rot = 0;

// レンダラーを作成
const canvasElement = document.querySelector("#canvas");
const renderer = new THREE.WebGLRenderer({
    antialias: false,
    canvas: canvasElement,
});

// シーンを作成
const scene = new THREE.Scene();

// カメラを作成
const camera = new THREE.PerspectiveCamera(45, 1.0, 1, 5000);
camera.position.set(0, 0, +1000);

// カメラコントローラー作成
const controls = new OrbitControls(camera, canvasElement);
controls.enablePan = false;

// カメラを滑らかに
controls.enableDamping = true;
controls.dampingFactor = 0.2;

//ラジアン変換
const radian = rot * Math.PI / 180;
camera.position.x = 1000 * Math.sin(radian);
camera.position.y = 1000 * Math.cos(radian);
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

    //カメラのアスペクト比調整
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}






let input = document.getElementById("inputImage");
let image = document.getElementById("image");
input.addEventListener("change", DisplayImage);

function DisplayImage(){

    //ファイル読み込みクラス
    let reader = new FileReader();

    //読み込んだファイルのURLをresultに格納
    reader.readAsDataURL(input.files[0]);
    
    //読み込みが完了次第，画像のURLをsrcに格納して表示
    reader.onload = function(e){
        image.src = e.target.result;
        image.onload = function(){
            CreatePointsRGB();
        }
    }
}

//canvas
let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d", {willReadFrequently: true});
const radius = 200;
const material = new THREE.RawShaderMaterial({
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragmentShader").textContent
});

function CreatePointsRGB(){
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const plane = new THREE.AxesHelper(300);
    scene.add(plane);
    let imageData = ctx.getImageData(0, 0, image.width, image.height);
    let imageSize = imageData.data.length;
    const boxes = [];
    const colors = [];
    for(let i=0; i<imageSize; i+=4){
        let [r, g, b] = [imageData.data[i], imageData.data[i+1], imageData.data[i+2]];
        [r, g, b] = [r/255, g/255, b/255];
        // const color = new THREE.Color(r, g, b);
        // const material = new THREE.SpriteMaterial({color: color});
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const geometryTrans = geometry.translate(r*radius, g*radius, b*radius);
        boxes.push(geometryTrans);
        colors.push(...[r,g,b]);
    }
    const geometris = BufferGeometryUtils.mergeGeometries(boxes);
    const mesh = new THREE.Mesh(geometris, material);
    scene.add(mesh);
}

CreateCubeRGB();

function CreateCubeRGB(){
    const NUM = 10;
    for(let i=0; i<NUM; i++){
        for(let j=0; j<NUM; j++){
            for(let k=0; k<NUM; k++){
                
            }
        }
    }
}

// function ArrayEqual(a = [], b = []){
//     return a.toString() == b.toString(); 
// }

// function ArraysIncludes(arrays = [], array = []){
//     for(const val of arrays){
//         if(ArrayEqual(val, array)){
//             return true;
//         }
//     }
// }

// function RGBIncludes(R=[], G=[], B=[], r, g, b){
//     if(R.includes(r) && G.includes(g) && B.includes(b)){
//         return true;
//     }
//     return false;
// }
