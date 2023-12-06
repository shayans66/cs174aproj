import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Subdivision_Sphere, Cube, Square, Axis_Arrows, Textured_Phong} = defs
let balloons = [];
const canvas = document.getElementById("main-canvas");
let falling_objects = [];
let explosions = [];

const maxX = 20
const minX = -20
const spawnY = 2.5;
const maxY = 25;

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

class FallingObject {
    constructor(shapes, materials, x, y) {
        this.shapes = shapes;
        this.materials = materials;
        this.x = x;
        this.y = y;
        this.initial_y = y; // Store the initial y position for reference
        this.vertical_speed = 0; // Initialize vertical speed
        this.falling = false; // Flag to indicate if object is falling
        // this.is_falling = true; // Flag to indicate if object is falling

        this.gravity = 0.005; // Set a gravity value
        this.idk = .01

        this.velocity_y = .1;
        this.acceleration_y = .01; // Update vertical velocity based on gravity
    }

    draw_falling_object(context, program_state, model_transform) {
        model_transform = model_transform.times(Mat4.translation(this.x, this.y, 0));
        this.shapes.square.draw(context, program_state, model_transform, this.materials.debris);
    }

    update_position() {
        if (this.falling) {
            // console.log('jfls');
            // let
            this.gravity += this.idk
            this.velocity_y -= this.gravity; // Update vertical velocity based on gravity
            // this.y -= this.velocity_y; // Update vertical position based on velocity
            // return this.y

            // console.log(this.velocity_y);

            return -this.velocity_y; // Update vertical position based on velocity


            // Optional: Stop falling when the object reaches a certain height or ground level (e.g., y = 0)
            // You can add additional conditions to stop falling based on your game's requirements
            // For example, if (this.y <= 0) { this.is_falling = false; }

            // return this.y
        }
    }

    start_fall() {
        this.falling = true; // Trigger the falling effect
    }

    // fall() {
    //     if (this.falling) {
    //         this.vertical_speed += this.gravity; // Apply gravity to vertical speed
    //         this.y -= this.vertical_speed; // Update y position based on vertical speed
    //     }
    // }


}


// Assuming you have shapes and materials directly accessible in the current scope
// For example:
// const shapes = { sphere: new Subdivision_Sphere(4), cube: new Cube() };
// const materials = { phong: new Material(new Textured_Phong(), { color: hex_color("#2cc7e2") }) };

canvas.addEventListener("click", function (event) {
    const mousePos = getMousePos(event);
    for (let i = 0; i < balloons.length; i++) {
        if (balloons[i].is_clicked(mousePos.x, mousePos.y)) {
            let object_color = color(Math.random(), Math.random(), Math.random(), 1);
            let falling_object = new FallingObject(balloons[i].shapes, balloons[i].materials, balloons[i].x, balloons[i].y);
            falling_objects.push(falling_object);
            falling_object.start_fall(); // Trigger falling for the object
            explosions.push(new Explosion(balloons[i].shapes, balloons[i].materials, balloons[i].x, balloons[i].y))
            balloons[i].delete();
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



class Balloon {
    constructor(shapes, materials, balloon_color, x, y) {
        this.shapes = shapes;
        this.materials = materials;
        this.x = x;
        this.y = y;
        this.balloon_color = balloon_color;
    }

    delete() {
        const index = balloons.indexOf(this);
        if (index !== -1) {
            balloons.splice(index, 1);
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


    draw_balloon(context, program_state, model_transform) {
        model_transform = model_transform.times(Mat4.translation(this.x, this.y, 0));
        model_transform = model_transform.times(Mat4.scale(2, 2, 1));
        this.shapes.square.draw(context, program_state, model_transform, this.materials.spaceship);
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
            spaceship: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/spaceship.png")
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
        }


        let rand = color(getRandomNumberBetween(100, 200), getRandomNumberBetween(100, 200), getRandomNumberBetween(100, 200), 1);
        balloons.push(new Balloon(this.shapes, this.materials, rand,0, 2.5));
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.previous_time = 0;

        this.buckets = [];
        this.buckets.push(new Bucket(this.shapes, this.materials, "right", 0));
    }

    make_control_panel() {

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

        if (current_time - this.previous_time > 2000) {
            let random_x = (Math.random() - 0.5) * (maxX - minX);
            let rand = color(Math.random(), Math.random(), Math.random(), 1);
            balloons.push(new Balloon(this.shapes, this.materials, rand, random_x, spawnY))
            this.previous_time = current_time;
        }
        balloons = balloons.filter(balloon => balloon.y < maxY);

        let model_transform = Mat4.identity();
        for (let i = 0; i < balloons.length; i++){
            balloons[i].y += .1;
            balloons[i].draw_balloon(context, program_state, model_transform);
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
        for (let i = 0; i < falling_objects.length; i++) {
            // console.log(i);
            let a = falling_objects[i]
            //console.log(i,a);
            let vel = a.update_position(); // Update the position of falling objects based on gravity
            // model_transform = model_transform.times(Mat4.translation(1, 0, 0));
            let tmp = model_transform
            let tmp2 = tmp.times(Mat4.translation(0, -vel, 0));
            // model_transform = model_transform.times(Mat4.translation(0, -1, 0));
            // falling_objects[i].draw(context, program_state, model_transform); // Draw falling objects
            falling_objects[i].draw_falling_object(context, program_state, tmp2); // Draw falling objects

            // if(a.y<0)falling_objects[i].delete();
        }

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

