import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Structura implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Structura',
		name: 'structura',
		icon: 'file:structura.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Extract structured data from PDF, invoices, receipts and images into JSON, Excel, Markdown using OCR + AI — 99.8% accuracy',
		defaults: { name: 'Structura' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'structuraApi',
				required: true,
			},
		],
		properties: [
			// ── Operation ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'extractDocument',
				options: [
					{
						name: 'Extract Document',
						value: 'extractDocument',
						description: 'Upload a PDF, invoice, receipt or image and extract structured data (JSON, Excel, Markdown) using AI',
						action: 'Extract structured data from a document',
					},
					{
						name: 'Get Document',
						value: 'getDocument',
						description: 'Get document status and extraction result',
						action: 'Get document status and result',
					},
					{
						name: 'List Documents',
						value: 'listDocuments',
						description: 'List all processed documents',
						action: 'List all documents',
					},
					{
						name: 'Download Result',
						value: 'downloadResult',
						description: 'Download the extracted result as a file',
						action: 'Download extraction result',
					},
					{
						name: 'Get Credits',
						value: 'getCredits',
						description: 'Check your current credit balance',
						action: 'Get credit balance',
					},
				],
			},

			// ── Extract Document Fields ──
			{
				displayName: 'Binary File',
				name: 'binaryData',
				type: 'boolean',
				default: true,
				description: 'Whether the document to process should be taken from a binary field',
				displayOptions: { show: { operation: ['extractDocument'] } },
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property containing the document (PDF, image)',
				displayOptions: { show: { operation: ['extractDocument'], binaryData: [true] } },
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				default: 'JSON',
				description: 'Format of the extracted data',
				displayOptions: { show: { operation: ['extractDocument'] } },
				options: [
					{ name: 'JSON', value: 'JSON', description: 'Structured JSON — requires extraction schema' },
					{ name: 'Markdown', value: 'MARKDOWN', description: 'Formatted markdown with tables and headers' },
					{ name: 'Text', value: 'TEXT', description: 'Plain text extraction' },
					{ name: 'Spreadsheet', value: 'SPREADSHEET', description: 'Tabular JSON — requires extraction schema' },
				],
			},
			{
				displayName: 'Extraction Schema',
				name: 'extractionSchema',
				type: 'json',
				default: '{\n  "type": "object",\n  "properties": {\n    "empresa": {\n      "type": "string",\n      "description": "Nome da empresa"\n    },\n    "valor_total": {\n      "type": "number",\n      "description": "Valor total do documento"\n    },\n    "data": {\n      "type": "string",\n      "description": "Data do documento"\n    },\n    "itens": {\n      "type": "array",\n      "description": "Lista de itens",\n      "items": {\n        "type": "object",\n        "properties": {\n          "descricao": {\n            "type": "string",\n            "description": "Descrição do item"\n          },\n          "valor": {\n            "type": "number",\n            "description": "Valor do item"\n          }\n        }\n      }\n    }\n  },\n  "required": ["empresa", "valor_total"]\n}',
				description: 'JSON Schema defining the fields to extract. Each field MUST have a "description". Required for JSON and Spreadsheet output formats.',
				displayOptions: {
					show: { operation: ['extractDocument'], outputFormat: ['JSON', 'SPREADSHEET'] },
				},
			},
			{
				displayName: 'Processing Mode',
				name: 'processingMode',
				type: 'options',
				default: 'fast',
				description: 'Processing speed and accuracy trade-off',
				displayOptions: { show: { operation: ['extractDocument'] } },
				options: [
					{ name: 'Fast', value: 'fast', description: 'Fastest — max 3 pages, 1 credit/page' },
					{ name: 'Balanced', value: 'balanced', description: 'Good balance — 1 credit/page' },
					{ name: 'Accurate', value: 'accurate', description: 'Highest accuracy — 2 credits/page' },
				],
			},
			{
				displayName: 'Page Range',
				name: 'pageRange',
				type: 'string',
				default: '',
				placeholder: '1-5,10',
				description: 'Specific pages to process (e.g. "1-5,10"). Leave empty for all pages.',
				displayOptions: { show: { operation: ['extractDocument'] } },
			},
			{
				displayName: 'Wait for Completion',
				name: 'waitForCompletion',
				type: 'boolean',
				default: true,
				description: 'Whether to wait until the document is fully processed before continuing. If disabled, returns immediately with the document ID.',
				displayOptions: { show: { operation: ['extractDocument'] } },
			},
			{
				displayName: 'Max Wait Time (seconds)',
				name: 'maxWaitTime',
				type: 'number',
				default: 120,
				description: 'Maximum time to wait for processing (in seconds)',
				displayOptions: { show: { operation: ['extractDocument'], waitForCompletion: [true] } },
			},

			// ── Get Document Fields ──
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the document to retrieve',
				displayOptions: { show: { operation: ['getDocument', 'downloadResult'] } },
			},

			// ── List Documents Fields ──
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 20,
				description: 'Max number of results to return (1-100)',
				displayOptions: { show: { operation: ['listDocuments'] } },
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { operation: ['listDocuments'] } },
				options: [
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: '',
						options: [
							{ name: 'All', value: '' },
							{ name: 'Completed', value: 'COMPLETED' },
							{ name: 'Processing', value: 'PROCESSING' },
							{ name: 'Failed', value: 'FAILED' },
							{ name: 'Pending', value: 'PENDING' },
						],
					},
					{
						displayName: 'Search (Filename)',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Search by filename',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'extractDocument') {
					const result = await extractDocument.call(this, i);
					returnData.push({ json: result, pairedItem: { item: i } });
				} else if (operation === 'getDocument') {
					const result = await getDocument.call(this, i);
					returnData.push({ json: result, pairedItem: { item: i } });
				} else if (operation === 'listDocuments') {
					const result = await listDocuments.call(this, i);
					returnData.push({ json: result, pairedItem: { item: i } });
				} else if (operation === 'downloadResult') {
					const result = await downloadResult.call(this, i);
					returnData.push(result);
				} else if (operation === 'getCredits') {
					const result = await getCredits.call(this, i);
					returnData.push({ json: result, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
				} else {
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}

// ── Helper: API Request ──

async function apiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
	options?: Partial<IHttpRequestOptions>,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('structuraApi');
	const baseUrl = credentials.baseUrl as string;

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}/api/v1${endpoint}`,
		qs: qs ?? {},
		json: true,
		...options,
	};

	if (body && method !== 'GET') {
		requestOptions.body = body;
	}

	return this.helpers.httpRequestWithAuthentication.call(
		this,
		'structuraApi',
		requestOptions,
	) as Promise<IDataObject>;
}

// ── Operation: Extract Document ──

async function extractDocument(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const binaryData = this.getNodeParameter('binaryData', i) as boolean;
	const outputFormat = this.getNodeParameter('outputFormat', i) as string;
	const processingMode = this.getNodeParameter('processingMode', i) as string;
	const pageRange = this.getNodeParameter('pageRange', i) as string;
	const waitForCompletion = this.getNodeParameter('waitForCompletion', i) as boolean;

	if (!binaryData) {
		throw new NodeOperationError(this.getNode(), 'Binary data input is required for document extraction', { itemIndex: i });
	}

	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
	const binaryItem = this.helpers.assertBinaryData(i, binaryPropertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

	const fileName = binaryItem.fileName ?? 'document.pdf';
	const mimeType = binaryItem.mimeType ?? 'application/pdf';

	const credentials = await this.getCredentials('structuraApi');
	const baseUrl = credentials.baseUrl as string;
	const apiKey = credentials.apiKey as string;

	// Build multipart form data using the legacy request helper (reliable for file uploads)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const formData: any = {
		file: {
			value: buffer,
			options: {
				filename: fileName,
				contentType: mimeType,
			},
		},
		output_format: outputFormat,
		processing_mode: processingMode,
	};

	if (outputFormat === 'JSON' || outputFormat === 'SPREADSHEET') {
		const extractionSchema = this.getNodeParameter('extractionSchema', i) as string;
		formData['extraction_schema'] = extractionSchema;
	}

	if (pageRange) {
		formData['page_range'] = pageRange;
	}

	const uploadResponse = await this.helpers.request({
		method: 'POST',
		uri: `${baseUrl}/api/v1/upload/`,
		formData,
		headers: {
			'X-API-Key': apiKey,
		},
		json: true,
	}) as IDataObject;

	if (!waitForCompletion) {
		return uploadResponse;
	}

	// Poll for completion
	const maxWaitTime = this.getNodeParameter('maxWaitTime', i) as number;
	const documentId = uploadResponse.document_id as string;
	const startTime = Date.now();
	const pollInterval = 2000; // 2 seconds

	while (Date.now() - startTime < maxWaitTime * 1000) {
		const doc = await apiRequest.call(this, 'GET', `/documents/${documentId}`);

		if (doc.status === 'COMPLETED') {
			// Flatten result_data for easier access in n8n workflows
			const resultData = doc.result_data as IDataObject | undefined;
			if (resultData) {
				const content = resultData.content;
				// For JSON/SPREADSHEET: parse content into structured data
				if (typeof content === 'string' && (outputFormat === 'JSON' || outputFormat === 'SPREADSHEET')) {
					try {
						doc['extracted_data'] = JSON.parse(content);
					} catch {
						doc['extracted_data'] = content;
					}
				} else {
					// For TEXT/MARKDOWN: keep as string
					doc['extracted_data'] = content;
				}
			}
			return doc;
		}

		if (doc.status === 'FAILED') {
			throw new NodeOperationError(
				this.getNode(),
				`Document processing failed: ${JSON.stringify(doc.result_data)}`,
				{ itemIndex: i },
			);
		}

		// Wait before next poll
		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}

	throw new NodeOperationError(
		this.getNode(),
		`Document processing timed out after ${maxWaitTime}s. Document ID: ${documentId}. Use "Get Document" to check status later.`,
		{ itemIndex: i },
	);
}

// ── Operation: Get Document ──

async function getDocument(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const documentId = this.getNodeParameter('documentId', i) as string;
	return apiRequest.call(this, 'GET', `/documents/${documentId}`);
}

// ── Operation: List Documents ──

async function listDocuments(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const limit = this.getNodeParameter('limit', i) as number;
	const filters = this.getNodeParameter('filters', i) as IDataObject;

	const qs: IDataObject = { limit };

	if (filters.status) {
		qs['status'] = filters.status;
	}
	if (filters.search) {
		qs['search'] = filters.search;
	}

	return apiRequest.call(this, 'GET', '/documents', undefined, qs);
}

// ── Operation: Download Result ──

async function downloadResult(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const documentId = this.getNodeParameter('documentId', i) as string;
	const credentials = await this.getCredentials('structuraApi');
	const baseUrl = credentials.baseUrl as string;

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'structuraApi',
		{
			method: 'GET',
			url: `${baseUrl}/api/v1/documents/${documentId}/download-result`,
			encoding: 'arraybuffer',
			returnFullResponse: true,
			json: false,
		},
	) as { body: Buffer; headers: IDataObject };

	const contentDisposition = (response.headers?.['content-disposition'] as string) ?? '';
	const filenameMatch = contentDisposition.match(/filename=(.+)/);
	const fileName = filenameMatch ? filenameMatch[1] : `result_${documentId}.json`;

	const contentType = (response.headers?.['content-type'] as string) ?? 'application/json';
	const bodyBuffer = Buffer.from(response.body);
	const bodyString = bodyBuffer.toString('utf-8');

	const binaryData = await this.helpers.prepareBinaryData(
		bodyBuffer,
		fileName,
		contentType,
	);

	// Build JSON output based on content type
	// JSON/SPREADSHEET → parse structured data into json output
	// TEXT/MARKDOWN → return content as string in json output
	let jsonOutput: IDataObject = { document_id: documentId, filename: fileName, content_type: contentType };

	if (contentType === 'application/json') {
		try {
			const parsed = JSON.parse(bodyString) as IDataObject;
			jsonOutput = { ...jsonOutput, ...parsed };
		} catch {
			jsonOutput['content'] = bodyString;
		}
	} else {
		// text/plain or text/markdown — return content directly
		jsonOutput['content'] = bodyString;
	}

	return {
		json: jsonOutput,
		binary: { data: binaryData },
		pairedItem: { item: i },
	};
}

// ── Operation: Get Credits ──

async function getCredits(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	void i;
	return apiRequest.call(this, 'GET', '/users/me');
}
