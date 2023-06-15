import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

let rot = 0;

// レンダラーを作成
const canvasElement = document.querySelector("#canvas");
const renderer = new THREE.WebGLRenderer({
    antialias: true,
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
    renderer.setClearColor(0xC0C0C0, 1);

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
const RADIUS = 200;

function CheckFileExtension(fileName){
  return fileName.split(".").pop();
}

function CreatePointsRGB(){
    ClearScene();
    const useAlphaChannel = CheckFileExtension(input.files[0].name) == "png" ? true : false;
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    CreateAxisRGB();
    let imageData = ctx.getImageData(0, 0, image.width, image.height);
    let imageSize = imageData.data.length;
    const boxes = [];
    const colorItemSize = useAlphaChannel ? 4 : 3;
    for(let i=0; i<imageSize; i+=colorItemSize){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        let [r, g, b] = [imageData.data[i], imageData.data[i+1], imageData.data[i+2]];
        [r, g, b] = [r/255, g/255, b/255];
        let colors = [];
        for(let j=0, len = geometry.attributes.position.count*3; j<len; j+=3){
            colors[j] = r;
            colors[j+1] = g;
            colors[j+2] = b;
        }
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const geometryTrans = geometry.translate(r*RADIUS, g*RADIUS, b*RADIUS);
        boxes.push(geometryTrans);
        // colors = [];
    }
    const geometries = BufferGeometryUtils.mergeGeometries(boxes);
    // console.log(count);
    // console.log(geometries.attributes.position.count);
    // const material = new THREE.RawShaderMaterial({
    //     vertexShader: document.getElementById("RGBvertexShader").textContent,
    //     fragmentShader: document.getElementById("RGBfragmentShader").textContent
    // });
    const material = new THREE.MeshBasicMaterial({
        vertexColors: true
    });
    const mesh = new THREE.Mesh(geometries, material);
    scene.add(mesh);
}

function ClearScene(){
    while(scene.children.length > 0){
        scene.remove(scene.children[0]);
    }
}

// CreateCubeRGB();

// function CreateCubeRGB(){
//     const NUM = 10;
//     for(let i=0; i<NUM; i++){
//         for(let j=0; j<NUM; j++){
//             for(let k=0; k<NUM; k++){
                
//             }
//         }
//     }
// }

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


function CreatePointsHSL(){
    ClearScene();
    const useAlphaChannel = CheckFileExtension(input.files[0].name) == "png" ? true : false;
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    let imageData = ctx.getImageData(0, 0, image.width, image.height);
    let imageSize = imageData.data.length;
    let boxes = [];
    const colorItemSize = useAlphaChannel ? 4 : 3;
    for(let i=0; i<imageSize; i+=colorItemSize){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        let [r, g, b] = [imageData.data[i], imageData.data[i+1], imageData.data[i+2]];
        [r, g, b] = [r/255, g/255, b/255];
        let [h, s, l] = rgb2hsl(r,g,b);
        const rad = RADIUS;
        const theta = (1-l) * Math.PI;
        const phi = h;
        const geometryTrans = geometry.translate(
                s*rad*Math.sin(theta)*Math.cos(phi),
                rad*Math.cos(theta),
                s*rad*Math.sin(theta)*Math.sin(phi)
        );
        boxes.push(geometryTrans);
        let colors = [];
        for(let j=0, len = geometry.attributes.position.count*3; j<len; j+=3){
            colors[j] = r;
            colors[j+1] = g;
            colors[j+2] = b;
        }
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
    const geometries = BufferGeometryUtils.mergeGeometries(boxes);
    const material = new THREE.MeshBasicMaterial({
        vertexColors: true
    });
    const mesh = new THREE.Mesh(geometries, material);
    scene.add(mesh);
}

function rgb2hsl (r, g, b) {

	let max = Math.max( r, g, b ) ;
	let min = Math.min( r, g, b ) ;
	let diff = max - min ;

	let h = 0 ;
	let s = (diff == 0) ? 0 : diff / (1-(Math.abs(max + min - 1)));
	let l = (max + min) / 2;


	switch( min ) {
		case max :
			h = 0 ;
		break ;

		case r :
			h = (60 * ((b - g) / diff)) + 180 ;
		break ;

		case g :
			h = (60 * ((r - b) / diff)) + 300 ;
		break ;

		case b :
			h = (60 * ((g - r) / diff)) + 60 ;
		break ;
	}

    h = h * (Math.PI/180);

	return [h, s, l] ;
}

function lerp (a, b, p){
    return a + (b - a)*p;
}

CreateCubeHSL();
function CreateCubeHSL(){
    let boxes = [];
    for(let r=0; r<256; r+=15){
        for(let g=0; g<256; g+=15){
            for(let b=0; b<256; b+=15){
                const geometry = new THREE.BoxGeometry(5, 5, 5);
                const [R, G, B] = [r/255, g/255, b/255];
                let [h, s, l] = rgb2hsl(R,G,B);
                const rad = RADIUS;
                const theta = (1-l) * Math.PI;
                const phi = h;
                let colors = [];
                for(let j=0, len = geometry.attributes.position.count*3; j<len; j+=3){
                    colors[j] = R;
                    colors[j+1] = G;
                    colors[j+2] = B;
                }
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                const geometryTrans = geometry.translate(
                        s*rad*Math.sin(theta)*Math.cos(phi),
                        rad*Math.cos(theta),
                        s*rad*Math.sin(theta)*Math.sin(phi));
                boxes.push(geometryTrans);
            }
        }
    }
    const geometries = BufferGeometryUtils.mergeGeometries(boxes);
    const material = new THREE.MeshBasicMaterial({
        vertexColors: true
    });
    const mesh = new THREE.Mesh(geometries, material);
    scene.add(mesh);
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