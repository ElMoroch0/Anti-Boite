import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import getLayer from "./getLayer.js";
import getStarfield from "./getStarField.js";

// Sons par phase
const audioPhase1 = new Audio("/son1.flac");
const audioPhase2 = new Audio("/son2.oga");
const audioPhase3 = new Audio("/son3.flac");
const audioPhase4 = new Audio("/son4.flac");

audioPhase3.loop = true;

// Définir le volume
audioPhase1.volume = 1.0;
audioPhase2.volume = 1.0;
audioPhase3.volume = 1.0;
audioPhase4.volume = 1.0;

const startButton = document.getElementById("startButton");
const menuFullscreen = document.getElementById("menuFullscreen");

let phase1Triggered = false;

// ---------------------------
// Utilitaires
// ---------------------------
startButton.addEventListener("click", () => {
    menuFullscreen.style.display = "none";

    if (!phase1Triggered) {
        audioPhase1.play();
        phase1Triggered = true;
    }

    // ---- ENVOI VISITE AU BACKEND ----
    let sessionId = localStorage.getItem("session_id");
    fetch("http://localhost:8000/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId })
    })
    .then(res => res.json())
    .then(data => {
        sessionId = data.session_id;
        localStorage.setItem("session_id", sessionId);
    })
    .catch(err => console.warn("Erreur visit backend:", err));
    // --------------------------------

    objects.forEach(entry => {
        if (entry.phase1) {
            entry.phase1.reset();
            entry.phase1.play();
        }
    });
});

// ---------------------------
// Scene, Camera, Renderer
// ---------------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

let isUserInteracting = false;
controls.addEventListener('start', () => { isUserInteracting = true; });
controls.addEventListener('end', () => { isUserInteracting = false; });

// ---------------------------
// Lights, Background, Stars
// ---------------------------
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
scene.add(getLayer({ hue: 0.6, numSprites: 8, opacity: 0.2, radius: 10, size: 24, z: -15 }));
scene.add(getStarfield({ numStars: 500 }));

// ---------------------------
// Globals
// ---------------------------
const objects = [];
let phase2Triggered = false;
let phase3Triggered = false;
const clock = new THREE.Clock();

const buttonX = document.getElementById("buttonX");
if (buttonX) buttonX.style.display = "none";

const textContainer = document.getElementById("phase4TextContainer");

const PHASE_REGEX = /^phase([123])_(.+)Action$/i;

// ---------------------------
// Load GLB
// ---------------------------
const rootGroup = new THREE.Group();
scene.add(rootGroup);

new GLTFLoader().load("./public/AntiRevueScene18.glb", (gltf) => {
    const root = gltf.scene;
    root.rotation.y = Math.PI / 2;
    root.scale.set(0.1, 0.1, 0.1);
    rootGroup.add(root);
    rootGroup.position.y = -2;

    const map = {};
    gltf.animations.forEach((clip) => {
        const m = clip.name.match(PHASE_REGEX);
        if (!m) return;
        const phase = `phase${m[1]}`;
        const objName = m[2];
        if (!map[objName]) map[objName] = {};
        map[objName][phase] = clip;
    });

    Object.keys(map).forEach((objName) => {
        const node = root.getObjectByName(objName);
        if (!node) return;

        const mixer = new THREE.AnimationMixer(node);
        const clips = map[objName];

        const entry = {
            node,
            mixer,
            phase1: null,
            phase2: null,
            phase3: null,
            phase4Active: false,
            phase3FinalPosition: null,
            phase3FinalRotation: null,
            phase4Text: null
        };
        objects.push(entry);

        if (clips.phase1) {
            const action = mixer.clipAction(clips.phase1);
            action.loop = THREE.LoopOnce;
            action.clampWhenFinished = true;
            action.reset();
            entry.phase1 = action;
        }

        if (clips.phase2) {
            const action = mixer.clipAction(clips.phase2);
            action.loop = THREE.LoopOnce;
            action.clampWhenFinished = true;
            entry.phase2 = action;
        }

        if (clips.phase3) {
            const action = mixer.clipAction(clips.phase3);
            action.loop = THREE.LoopRepeat;
            entry.phase3 = action;
        }

        if (textContainer) {
            const texteParObjet = { 
                // ---- Texte individuel pour chaque objet (Phase4) ----
                "anti-mots": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Mots, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon",
                "anti-anti_petites_choses_de_la_vie": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Petits Choses de la Vie, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon",
                "anti-armée": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Armée, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-bouquet": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Bouquet, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-esoterisme": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Esoterisme, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-images": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Images, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-jambon": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Jambon, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-jardin": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Jardin, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-jeu_des_7_familles": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Jeu des 7 Familles, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-m": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-M, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-memoire": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Memoire, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-recueil": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Recueil, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-sport": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Sport, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-terrasse": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Terrasse, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-tourisme": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Anti-Tourisme, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anticosmetique": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet AntiCosmetiques, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "antidote": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet AntiDote, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "soupe_calloux": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet Soupe des Calloux, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-reel": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet AntiRéel, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-reel2": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet AntiRéel2, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon", 
                "anti-reel3": "Voici l'endroit dedié aux ecrits et aclaratives de l'artiste sur son projet AntiRéel3, pour l'edition n°0 de PlanetEdition ou aussi intitulé Anti par les etudiants de L'Ecole Supperieure d'Art D'Avignon" 
                
            };
            const div = document.createElement("div");
            div.classList.add("phase4-item");
            const texteNettoye = (texteParObjet[entry.node.name] || `Info sur ${entry.node.name}`).replace(/<br>/g, ' ');
            div.textContent = texteNettoye;
            textContainer.appendChild(div);
            entry.phase4Text = div;
        }
    });
}, undefined, (err) => console.error(err));

// ---------------------------
// Objets Phase2 autorisés / Phase4 bloqués
// ---------------------------
const phase4DisabledObjects = ["cubercle", "boite"]; 

// ---------------------------
// Raycaster
// ---------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoveredObject = null;

// ---------------------------
// Unified pointerdown : Phase2 + Phase4
// ---------------------------
window.addEventListener("pointerdown", (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    // ---------- PHASE 2 ----------
    if (!phase2Triggered) {
        const intersects2 = raycaster.intersectObjects(
            objects.filter(o => phase4DisabledObjects.includes(o.node.name)).map(o => o.node),
            true
        );
        if (intersects2.length === 0) return;

        phase2Triggered = true;
        
        if (hoveredObject) resetHovered();

        // ---- ENVOI INTERACTION PHASE 2 ----
        const sessionId = localStorage.getItem("session_id");
        intersects2.forEach(intersect => {
            let objectName = intersect.object.name;
            fetch("http://localhost:8000/interact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, object_name: objectName })
            }).catch(err => console.warn("Erreur interact backend:", err));
        });
        // --------------------------------

        objects.forEach(entry => {
            if (!entry.phase2) return;
            if (entry.phase1) entry.phase1.stop();
            const action = entry.phase2;
            action.reset();
            action.loop = THREE.LoopOnce;
            action.clampWhenFinished = true;
            action.play();

             // ---- jouer le son après 1 seconde ----
            setTimeout(() => {
               audioPhase2.currentTime = 0;
               audioPhase2.play().catch(err => console.warn("Impossible de jouer audioPhase2:", err));
            }, 1400);

            entry.mixer.removeEventListener("finished");
            entry.mixer.addEventListener("finished", (e) => {
                if (e.action !== action) return;
                if (entry.phase3) {
                    entry.phase3.reset();
                    entry.phase3.loop = THREE.LoopRepeat;
                    entry.phase3.play();
                    audioPhase3.play();
                    phase3Triggered = true;
                }
                entry.phase3FinalPosition = entry.node.position.clone();
                entry.phase3FinalRotation = entry.node.rotation.clone();
            });
        });
        return;
    }

    // ---------- PHASE 4 ----------
    if (phase3Triggered && !objects.some(e => e.phase4Active)) {
        const intersects4 = raycaster.intersectObjects(
            objects.filter(o => !phase4DisabledObjects.includes(o.node.name)).map(o => o.node),
            true
        );
        if (intersects4.length === 0) return;

        let clickedNode = intersects4[0].object;
        while (clickedNode && !objects.some(e => e.node === clickedNode)) clickedNode = clickedNode.parent;
        if (!clickedNode) return;

        const entry = objects.find(e => e.node === clickedNode);
        if (!entry) return;
        
        // ---- ENVOI INTERACTION PHASE 4 ----
        const sessionId = localStorage.getItem("session_id");
        fetch("http://localhost:8000/interact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, object_name: entry.node.name })
        }).catch(err => console.warn("Erreur interact backend:", err));
        // --------------------------------

        objects.forEach(e => { if (e.phase4Text) e.phase4Text.classList.remove("show"); e.phase4Active = false; });

        entry.phase4Active = true;
        audioPhase4.currentTime = 0;
        audioPhase4.play();

        if (entry.phase4Text && textContainer) {
            textContainer.style.display = "flex";
            entry.phase4Text.classList.add("show");
        }
        if (buttonX) buttonX.style.display = "block";
    }
});

// ---------------------------
// Reset hovered helper
// ---------------------------
function resetHovered() {
    if (!hoveredObject || !hoveredObject.material) return;
    if (Array.isArray(hoveredObject.material)) {
        hoveredObject.material.forEach(mat => mat.emissive.setHex(hoveredObject.currentHex || 0x000000));
    } else {
        hoveredObject.material.emissive.setHex(hoveredObject.currentHex || 0x000000);
    }
    hoveredObject = null;
}

// ---------------------------
// Bouton X pour Phase4
// ---------------------------
if (buttonX) buttonX.addEventListener("click", () => {
    objects.forEach(entry => { if (entry.phase4Text) entry.phase4Text.classList.remove("show"); entry.phase4Active = false; });
    textContainer.style.display = "none";
    buttonX.style.display = "none";
    audioPhase4.pause();
    audioPhase4.currentTime = 0;
    if (phase3Triggered) audioPhase3.play();
});

// ---------------------------
// Pointer move hover
// ---------------------------
window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    if ((phase2Triggered && !phase3Triggered) || objects.some(e => e.phase4Active)) { resetHovered(); return; }

    let hoverableObjects = [];
    if (!phase2Triggered) hoverableObjects = objects.filter(o => phase4DisabledObjects.includes(o.node.name)).map(o => o.node);
    else if (phase3Triggered) hoverableObjects = objects.filter(o => !phase4DisabledObjects.includes(o.node.name)).map(o => o.node);

    const intersects = raycaster.intersectObjects(hoverableObjects, true);
    resetHovered();

    if (intersects.length > 0) {
        let object = intersects[0].object;
        while (object && !objects.some(e => e.node === object)) object = object.parent;
        if (!object) return;

        if (!object.currentHex) object.currentHex = Array.isArray(object.material) ? object.material[0].emissive.getHex() : object.material.emissive.getHex();

        const isPhase2 = phase4DisabledObjects.includes(object.name);
        const highlightColor = isPhase2 ? 0x00ff00 : 0xffff00;
        if (Array.isArray(object.material)) object.material.forEach(mat => mat.emissive.setHex(highlightColor));
        else object.material.emissive.setHex(highlightColor);

        hoveredObject = object;
    }
});

// ---------------------------
// Animate
// ---------------------------
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    objects.forEach(entry => {
        entry.mixer.update(delta);
        if (entry.phase4Active) {
            const distanceFromCamera = 4.3;
            const lateralOffset = -3;
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir).normalize();
            const lateral = new THREE.Vector3();
            lateral.crossVectors(dir, camera.up).normalize().multiplyScalar(lateralOffset);
            const worldTarget = new THREE.Vector3();
            worldTarget.copy(camera.position).add(dir.multiplyScalar(distanceFromCamera)).add(lateral);
            if (entry.node.parent) entry.node.position.copy(entry.node.parent.worldToLocal(worldTarget));
            else entry.node.position.copy(worldTarget);
            entry.node.rotation.y += 0.05;
        }
    });

    const phase3Objects = objects.filter(e => e.phase3 && !e.phase4Active);
    if (phase3Objects.length > 0 && !isUserInteracting) rootGroup.rotation.y += 0.0005;

    controls.update();
    renderer.render(scene, camera);
}

animate();

// ---------------------------
// Resize
// ---------------------------
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
