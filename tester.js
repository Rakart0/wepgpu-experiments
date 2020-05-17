async function start()
{

//On vérifie que le navigateur est compatible WebGPU
var entry = navigator.gpu;
if(entry == null)
{
    alert("WebGPU n'est pas supporté par ce navigateur");
    return;
}

    var engine = new Anjeh(entry,  document.getElementById("canvas"));
    engine.initialize();
    engine.configureSwapChain();
    engine.createTextureViews();

    engine.addObject(new Triangle());
    
    engine.loadShaders();

}


async function init()
{

//Création des Vertices et Indices buffers

let positionBuffer = createBuffer(positions, GPUBufferUsage.VERTEX, device);

let colorBuffer = createBuffer(colors, GPUBufferUsage.VERTEX, device);
let indexBuffer = createBuffer(indices, GPUBufferUsage.INDEX, device);



let layout = device.createPipelineLayout( {bindGroupLayouts: []});


const positionAttribDesc = {
    shaderLocation: 0, // [[attribute(0)]]
    offset: 0,
    format: 'float3'
};

const colorAttribDesc = {
    shaderLocation: 1, // [[attribute(1)]]
    offset: 0,
    format: 'float3'
};
const positionBufferDesc = {
    attributes: [ positionAttribDesc ],
    arrayStride: 4 * 3, // sizeof(float) * 3
    stepMode: 'vertex'
};
const colorBufferDesc = {
    attributes: [ colorAttribDesc ],
    arrayStride: 4 * 3, // sizeof(float) * 3
    stepMode: 'vertex'
};

const vertexState = {
    indexFormat: 'uint16',
    vertexBuffers: [ positionBufferDesc, colorBufferDesc ]
};

const vertexStage = {
    module: vertModule,
    entryPoint: 'main'
};

const fragmentStage = {
    module: fragModule,
    entryPoint: 'main'
};

const depthStencilState = {
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus-stencil8'
};

const colorState = {
    format: 'bgra8unorm',
    alphaBlend: {
        srcFactor: 'src-alpha',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add'
    },
    colorBlend: {
        srcFactor: 'src-alpha',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add'
    },
    writeMask: GPUColorWrite.ALL
};

const rasterizationState = {
    frontFace: 'cw',
    cullMode: 'none'
};

const pipelineDesc = {
    layout,

    vertexStage,
    fragmentStage,

    primitiveTopology: 'triangle-list',
    colorStates: [ colorState ],
    depthStencilState,
    vertexState,
    rasterizationState
};

let pipeline = device.createRenderPipeline(pipelineDesc);

function encodeCommands() {
    let colorAttachment = {
        attachment: colorTextureView,
        loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
        storeOp: 'store'
    };

    const depthAttachment = {
        attachment: depthTextureView,
        depthLoadValue: 1,
        depthStoreOp: 'store',
        stencilLoadValue: 'load',
        stencilStoreOp: 'store'
    };

    const renderPassDesc = {
        colorAttachments: [ colorAttachment ],
        depthStencilAttachment: depthAttachment
    };

    let commandEncoder = device.createCommandEncoder();

    // 🖌️ Encode drawing commands
     let passEncoder = commandEncoder.beginRenderPass(renderPassDesc);
    passEncoder.setPipeline(pipeline);
    // passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
    passEncoder.setScissorRect(0, 0, canvas.width, canvas.height);
    passEncoder.setVertexBuffer(0, positionBuffer);
    passEncoder.setVertexBuffer(1, colorBuffer);
    passEncoder.setIndexBuffer(indexBuffer);
    
    passEncoder.draw(3, 1, 0, 0);
    
    passEncoder.endPass();

    queue.submit([ commandEncoder.finish() ]);
}
    let render = () => {
        // ⏭ Acquire next image from swapchain
        colorTexture = swapchain.getCurrentTexture();
        colorTextureView = colorTexture.createView();
    
        // 📦 Write and submit commands to queue
        encodeCommands();
    
        // ➿ Refresh canvas
        // requestAnimationFrame(render);
    };

    render();
}


