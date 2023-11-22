import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Subdivision_Sphere, Cube, Axis_Arrows, Textured_Phong} = defs
let balloons = [];
const canvas = document.getElementById("main-canvas");

function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.clientWidth;
    const scaleY = rect.height / canvas.clientHeight;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}


canvas.addEventListener("click", function(event) {
    const mousePos = getMousePos(event);
    for (let i = 0; i < balloons.length; i++) {
        if (balloons[i].is_clicked(mousePos.x, mousePos.y)) {
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
        //convert mouse_x (1080) and mouse_y (600) to this coordinate system
        const transformedPoint = convertToB(mouse_x, mouse_y);
        const xPrime = transformedPoint.x;
        const yPrime = transformedPoint.y;
        console.log("xPrime is " + xPrime);
        console.log("yPrime is " + yPrime);
        console.log("this.x is " + this.x);
        console.log("this.y is " + this.y);
        const distance_squared = (xPrime - this.x) ** 2 + (yPrime - this.y) ** 2;
        const radius_squared_x = 2 ** 2; // Assuming radius is 1.5 (adjust according to your scale) in the x-direction
        const radius_squared_y = 3.75 ** 2; // Assuming radius is 1.5 (adjusted for y-stretch) in the y-direction
        return (distance_squared <= radius_squared_x) || (distance_squared <= radius_squared_y);

    }


    draw_balloon(context, program_state, model_transform) {
        model_transform = model_transform.times(Mat4.translation(this.x, this.y, 0));
        model_transform = model_transform.times(Mat4.scale(1, 1.5, 1));
        this.shapes.sphere.draw(context, program_state, model_transform, this.materials.phong.override({color: this.balloon_color}));
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
        model_transform = model_transform.times(Mat4.translation(this.x, 0, 0));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.phong);
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
            cube: new Cube()
        }

        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#2cc7e2"),
            }),
        }



        balloons = [];
        let rand = color(Math.random(), Math.random(), Math.random(), 1);
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
            let random_x = (Math.random() - 0.5) * 40;
            let rand = color(Math.random(), Math.random(), Math.random(), 1);
            balloons.push(new Balloon(this.shapes, this.materials, rand, random_x, 2.5))
            this.previous_time = current_time;
        }
        balloons = balloons.filter(balloon => balloon.y < 25);

        let model_transform = Mat4.identity();
        for (let i = 0; i < balloons.length; i++){
            balloons[i].y += .1;
            balloons[i].draw_balloon(context, program_state, model_transform);
        }
        for (let i = 0; i < this.buckets.length; i++) {
            if (this.buckets[i].direction === "left") {
                this.buckets[i].x -= .5;
            }
            else {
                this.buckets[i].x += .5;
            }
            if (this.buckets[i].x >= 22) {
                this.buckets[i].direction = "left";
            }
            else if (this.buckets[i].x <= -22) {
                this.buckets[i].direction = "right";
            }
            this.buckets[i].draw_bucket(context, program_state, model_transform);
        }
    }
}

