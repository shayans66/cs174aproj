import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Subdivision_Sphere, Cube, Square, Axis_Arrows, Textured_Phong} = defs
let spaceships = [];
const canvas = document.getElementById("main-canvas");
let falling_objects = [];
let explosions = [];

const maxX = 20;
const minX = -20;
const spawnY = 2.5;
const maxY = 25;
let score = 0;
let time_elapsed = 0;
let isGameOver = false;

function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.clientWidth;
    const scaleY = rect.height / canvas.clientHeight;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

function getRandomNumberBetween(low, high) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
}

function addScore (type){ // TO BE USED WHEN DEBRIS HITS BUCKET
    if (type === 1){ // blue spaceship, most points
        score += 10;
    }
    else if (type === 2){ // golden spaceship, least points
        score += 5;
    }
    else if (type === 3){ // red spaceship, negative points
        score -= 10;
    }
}

class FallingObject {
    constructor(shapes, materials, x, y, type1) {
        this.shapes = shapes;
        this.materials = materials;
        this.x = x;
        this.y = y;
        this.falling = false; // Flag to indicate if object is falling
        this.keepIn = true;
        this.type = type1;
        this.mass = 0;
        if (this.type === 1){
            this.mass = 2.5;
        }
        else if (this.type === 2){
            this.mass = 3.5;
        }
        else if (this.type === 3){
            this.mass = 3;
        }
        this.velocity = 0;
        this.time = 0;
    }


    draw_falling_object(context, program_state, model_transform) {
        model_transform = model_transform.times(Mat4.translation(this.x, this.y, 0));
        if (this.type === 1){
            this.shapes.square.draw(context, program_state, model_transform, this.materials.minerals);

        }
        else if (this.type === 2){
            this.shapes.square.draw(context, program_state, model_transform, this.materials.bananas);

        }
        else{
            this.shapes.square.draw(context, program_state, model_transform, this.materials.tnt);
        }

    }

    update_position() {
        if (this.falling) {
            let time = this.time/1000;
            const gravity = 9.8; // Acceleration due to gravity in m/s^2
            this.y -= gravity * this.mass * 0.01;
            const dampingFactor = 0.05; // Adjust this factor to control damping

            // Update the object's y value using the free fall equation
            this.y = this.y + (this.velocity * time) - (0.5 * gravity * time ** 2);

            // Update the object's velocity with damping
            this.velocity = this.velocity - gravity * time + dampingFactor * this.velocity;

        }
    }

    start_fall() {
        this.falling = true; // Trigger the falling effect
    }
}


// Assuming you have shapes and materials directly accessible in the current scope
// For example:
// const shapes = { sphere: new Subdivision_Sphere(4), cube: new Cube() };
// const materials = { phong: new Material(new Textured_Phong(), { color: hex_color("#2cc7e2") }) };

canvas.addEventListener("click", function (event) {
    const mousePos = getMousePos(event);
    for (let i = 0; i < spaceships.length; i++) {
        if (spaceships[i].is_clicked(mousePos.x, mousePos.y)) {
            let object_color = color(Math.random(), Math.random(), Math.random(), 1);
            let falling_object = new FallingObject(spaceships[i].shapes, spaceships[i].materials, spaceships[i].x, spaceships[i].y, spaceships[i].type);
            falling_objects.push(falling_object);
            falling_object.start_fall(); // Trigger falling for the object
            explosions.push(new Explosion(spaceships[i].shapes, spaceships[i].materials, spaceships[i].x, spaceships[i].y))
            spaceships[i].delete();
        }
    }
});


function convertToB(x, y) {
    // Define the transformation parameters
    const sx = 0.03704; // Scaling factor for x-axis
    const Tx = -0.741; // Translation along x-axis
    let sy = 0.0432692308;
    let mid = y - 520;

    // Calculate the transformed value
    let yPrime = -sy * mid + 2.5;

    // Calculate the transformed x and y coordinates
    const xPrime = sx * x + Tx - 20;

    return { x: xPrime, y: yPrime };
}

function gravitydiff(mass){
    const thrust = 100;
    const gravity = 9.8; // m/s², acceleration due to gravity
    const netForce= thrust - mass * gravity;
    const acceleration = netForce / mass;
    const positionChange = acceleration / 100; // 0.001 seconds for milliseconds
    return positionChange;
}

class SpaceShip {
    constructor(shapes, materials, x, y, type1) {
        this.shapes = shapes;
        this.materials = materials;
        this.x = x;
        this.y = y;
        this.type = 0;
        if (type1 === 1){
            this.type = 1; // blue spaceship, light, fast, and most points
            this.mass = 2.5;
        }
        else if (type1 === 2){ // golden spaceship, heavy, slow, and least points
            this.type = 2;
            this.mass = 3.5;
        }
        else if (type1 === 3){ // red spaceship, has tnt, moderate weight
            this.type = 3;
            this.mass = 3;
        }
    }

    delete() {
        const index = spaceships.indexOf(this);
        if (index !== -1) {
            spaceships.splice(index, 1);
        }
    }

    is_clicked(mouse_x, mouse_y) {
        const transformedPoint = convertToB(mouse_x, mouse_y);
        const xPrime = transformedPoint.x;
        const yPrime = transformedPoint.y;
        const distance_squared = (xPrime - this.x) ** 2 + (yPrime - this.y) ** 2;
        const radius_squared_x = 2 ** 2;
        const radius_squared_y = 3.5 ** 2;
        return (distance_squared <= radius_squared_x) || (distance_squared <= radius_squared_y);
    }

    draw_spaceship(context, program_state, model_transform) {
        model_transform = model_transform.times(Mat4.translation(this.x, this.y, 0));
        model_transform = model_transform.times(Mat4.scale(2, 2, 1));
        if (this.type === 1){
            this.shapes.square.draw(context, program_state, model_transform, this.materials.spaceship1);
        }
        else if (this.type === 2){
            this.shapes.square.draw(context, program_state, model_transform, this.materials.spaceship2);

        }
        else if (this.type === 3){
            this.shapes.square.draw(context, program_state, model_transform, this.materials.spaceshiptnt);
        }
    }
}

class Bucket {
    constructor(shapes, materials, direction, x) {
        this.shapes = shapes;
        this.materials = materials;
        this.direction = direction;
        this.x = x;
    }
    draw_bucket(context, program_state, model_transform) {
        model_transform = model_transform.times(Mat4.translation(this.x, 0.5, 0));
        model_transform = model_transform.times(Mat4.scale(3, 3, 1));
        this.shapes.square.draw(context, program_state, model_transform, this.materials.bucket);
    }
}

class Explosion {
    constructor(shapes, materials, x, y) {
        this.shapes=shapes;
        this.materials=materials;
        this.x=x;
        this.y=y;
        this.time_to_live = 500000;
        this.time_drawn = 0;
        this.first_call = true;
    }
    draw_explosion(context, program_state){
        let scale_f = (this.time_to_live)/300000;
        this.shapes.square.draw(context, program_state,
            Mat4.identity().times(Mat4.translation(this.x, this.y,0)).times(Mat4.scale(scale_f, scale_f, 0)), this.materials.explosion);
    }
    delete() {
        const index = explosions.indexOf(this);
        if (index !== -1) {
            explosions.splice(index, 1);
        }
    }
}

class GameOver {
    constructor(shapes, materials) {
        this.shapes = shapes;
        this.materials = materials;
    }

    draw_game_over(context, program_state, x, y) {
        this.shapes.square.draw(
            context,
            program_state,
            Mat4.identity()
                .times(Mat4.translation(0, 11, 0))
                .times(Mat4.scale(10, 10, 10)), // Adjust the scale if needed
            this.materials.gameover
        );
    }
}


export class Project extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        this.shapes = {
            sphere: new Subdivision_Sphere(4),
            cube: new Cube(),
            square: new Square(),
        }

        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#2cc7e2"),
                texture: null
            }),
            spaceship1: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/bluerocket.png")
            }),
            spaceship2: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/goldenrocket.png")
            }),
            spaceshiptnt: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/redrocket.png")
            }),
            bucket: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/bucket.png")
            }),
            explosion: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/explosion.png")
            }),
            debris: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/debris.png")
            }),
            minerals: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/minerals.png")
            }),
            bananas: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/bananas.png")
            }),
            tnt: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/tnt.png")
            }),
            gameover: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/game.png")
            }),
        }
        let randtype = Math.floor(Math.random() * 3) + 1;
        spaceships.push(new SpaceShip(this.shapes, this.materials,0, 2.5, randtype));
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.previous_time = 0;

        this.buckets = [];
        this.buckets.push(new Bucket(this.shapes, this.materials, "right", 0));
    }

    make_control_panel() {
        this.live_string(box => {
            box.textContent = "Score: " + (score);
        });
        this.new_line();
        this.live_string(box => {
            box.textContent = "Time Elapsed: " + (time_elapsed).toFixed(2) + " seconds";
        });
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, -11, -30));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position1 = vec4(10, 10, 10, 1);
        const light_position2 = vec4(-10, 10, 10, 1);
        const light_position3 = vec4(0, -10, 10, 1);
        program_state.lights = [new Light(light_position1, color(1, 1, 1, 1), 10000)];
        let current_time = program_state.animation_time;
        if (!isGameOver){
            time_elapsed = current_time/1000;
        }

        if (current_time >= 30 * 1000) {
            let gameover = new GameOver(this.shapes, this.materials);
            isGameOver = true;
            gameover.draw_game_over(context, program_state);
            return;
        }

        if (current_time - this.previous_time > 2000) {
            let random_x = (Math.random() - 0.5) * (maxX - minX);
            let randtype = Math.floor(Math.random() * 3) + 1;
            spaceships.push(new SpaceShip(this.shapes, this.materials, random_x, spawnY, randtype))
            this.previous_time = current_time;
        }

        spaceships = spaceships.filter(spaceship => spaceship.y < maxY);

        let model_transform = Mat4.identity();
        for (let i = 0; i < spaceships.length; i++){
            spaceships[i].y += gravitydiff(spaceships[i].mass);
            spaceships[i].draw_spaceship(context, program_state, model_transform);
        }
        for (let i = 0; i < this.buckets.length; i++) {
            if (this.buckets[i].direction === "left") {
                this.buckets[i].x -= .1;
            }
            else {
                this.buckets[i].x += .1;
            }
            if (this.buckets[i].x >= 20) {
                this.buckets[i].direction = "left";
            }
            else if (this.buckets[i].x <= -20) {
                this.buckets[i].direction = "right";
            }
            this.buckets[i].draw_bucket(context, program_state, model_transform);
        }

        // Iterate through falling objects and draw them
        // console.log(falling_objects);

        // check for collision with bucket
        let bucket = this.buckets[0];
        for (let i = 0; i < falling_objects.length; i++) {
            let obj_type = falling_objects[i].type;
            let a = falling_objects[i];
            if (falling_objects[i].x > bucket.x - 2 && falling_objects[i].x < bucket.x + 2 && falling_objects[i].y <= 3 && falling_objects[i].y >= 0) {
                addScore(obj_type);
                falling_objects[i].keepIn = false;
            }
            falling_objects[i].time += 1;
            falling_objects[i].update_position(); // Update the position of falling objects based on gravity
            falling_objects[i].draw_falling_object(context, program_state, model_transform); // Draw falling objects
        }
        falling_objects = falling_objects.filter(falling_object => falling_object.y >= 0);

        falling_objects = falling_objects.filter(falling_object => falling_object.keepIn);


        for (let i = 0; i < explosions.length; i++) {
            if (explosions[i].time_to_live <= 0){
                explosions[i].delete();
                continue;
            }
            else {
                explosions[i].time_to_live -= (current_time - explosions[i].time_drawn)
            }
            if (explosions[i].first_call === true) {
                explosions[i].first_call = false;
                explosions[i].time_drawn = current_time;
            }
            explosions[i].draw_explosion(context, program_state);
        }
    }
}