class Anjeh {
    entry;
    adapter;
    device;
    queue;

    canvas;
    context;

    swapchain;

    constructor(_gpu, _canvas) {
        this.entry = _gpu;
        this.canvas = _canvas;
    }

    async initialize() {

        this.adapter = await this.entry.requestAdapter();
        this.device = await this.adapter.requestDevice();
        this.queue = this.device.defaultQueue;
        this.context = this.canvas.getContext("gpupresent");
    }

    configureSwapChain(_swapChainDesc) {

        swapChainDesc;
        _swapChainDesc == null ? swapChainDesc = {
            device: device,
            format: 'bgra8unorm',
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_SRC
        } : swapChainDesc = _swapChainDesc;

        this.swapchain = this.context.configureSwapChain(swapChainDesc);
    }


    shaderManager;

    loadShaders() {

        let frag = await loadShader("/shaders/triangle.frag.spv")
        let vert = await loadShader("/shaders/triangle.vert.spv")
        let fragModule = device.createShaderModule({ code: frag });
        let vertModule = device.createShaderModule({ code: vert });


        shaderManager = new ShaderManager(fragModule, vertModule);

    }

    createTextureViews()
    {
        const depthTextureDesc = {
            size: {
                width: canvas.width,
                height: canvas.height,
                depth: 1
            },
            mipLevelCount: 1,
            sampleCount: 1,
            dimension: '2d',
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_SRC
        };
        
        var depthTexture = device.createTexture(depthTextureDesc);
        var depthTextureView = depthTexture.createView();
        
        let colorTexture = swapchain.getCurrentTexture();
        let colorTextureView = colorTexture.createView();
        
    }

    createPipeline() {
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
            attributes: [positionAttribDesc],
            arrayStride: 4 * 3, // sizeof(float) * 3
            stepMode: 'vertex'
        };
        const colorBufferDesc = {
            attributes: [colorAttribDesc],
            arrayStride: 4 * 3, // sizeof(float) * 3
            stepMode: 'vertex'
        };

        const vertexState = {
            indexFormat: 'uint16',
            vertexBuffers: [positionBufferDesc, colorBufferDesc]
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
            colorStates: [colorState],
            depthStencilState,
            vertexState,
            rasterizationState
        };

        let pipeline = device.createRenderPipeline(pipelineDesc);

    }


    rendererObject = [];

    addNewObject(object)
    {
        this.rendererObject.push(object);
    }
}