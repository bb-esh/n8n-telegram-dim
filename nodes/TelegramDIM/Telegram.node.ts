import type { Readable } from 'stream';

import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
} from 'n8n-workflow';
import { BINARY_ENCODING, NodeOperationError } from 'n8n-workflow';

import { addAdditionalFields, apiRequest, getPropertyName } from './GenericFunctions';

export class Telegram implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Telegram JSON Inline Menu',
		name: 'telegram',
		icon: 'file:telegram.svg',
		group: ['output'],
		version: [1, 1.1, 1.2],
		subtitle: '={{$parameter["operation"]}}',
		description: 'Sends messages to Telegram',
		defaults: {
			name: 'Telegram JSON Inline Menu',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'telegramApi',
				required: true,
			},
		],
		properties: [
			// ----------------------------------
			//         operation
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
					},
				},
				options: [
					{
						name: 'Edit Message Text',
						value: 'editMessageText',
						description: 'Edit a text message',
						action: 'Edit a text message',
					},
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a text message',
						action: 'Send a text message',
					}
				],
				default: 'sendMessage',
			},

			// ----------------------------------
			//         chat / message
			// ----------------------------------

			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'sendMessage',
						],
					},
				},
				required: true,
				description:
					'Unique identifier for the target chat or username of the target channel (in the format @channelusername)',
			},

			// ----------------------------------
			//         message
			// ----------------------------------

			// ----------------------------------
			//         message:editMessageText
			// ----------------------------------

			{
				displayName: 'Message Type',
				name: 'messageType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['editMessageText'],
					},
				},
				options: [
					{
						name: 'Message',
						value: 'message',
					},
				],
				default: 'message',
				description: 'The type of the message to edit',
			},

			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						messageType: ['message'],
						operation: ['editMessageText'],
					},
				},
				required: true,
				description:
					'Unique identifier for the target chat or username of the target channel (in the format @channelusername). To find your chat ID ask @get_id_bot.',
			},

			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						messageType: ['message'],
						operation: ['editMessageText'],
					},
				},
				required: true,
				description: 'Unique identifier of the message to edit',
			},


			// ----------------------------------
			//         message:sendMessage
			// ----------------------------------
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['editMessageText', 'sendMessage'],
					},
				},
				description: 'Text of the message to be sent',
			},

			// ----------------------------------
			//         message:editMessageText/sendAnimation/sendAudio/sendLocation/sendMessage/sendPhoto/sendSticker/sendVideo
			// ----------------------------------

			{
				displayName: 'Reply Markup',
				name: 'replyMarkup',
				displayOptions: {
					show: {
						operation: [
							'sendMessage',
						],
					},
				},
				type: 'options',
				options: [
					{
						name: 'Inline Keyboard JSON',
						value: 'inlineKeyboardJSON',
					},
					{
						name: 'None',
						value: 'none',
					},
				],
				default: 'none',
				description: 'Additional interface options',
			},

			{
				displayName: 'Reply Markup',
				name: 'replyMarkup',
				displayOptions: {
					show: {
						operation: [
							'editMessageText',
						],
					},
				},
				type: 'options',
				options: [
					{
						name: 'Inline Keyboard JSON',
						value: 'inlineKeyboardJSON',
					},
					{
						name: 'None',
						value: 'none',
					},
				],
				default: 'none',
				description: 'Additional interface options',
			},

			{
				displayName: 'Inline Keyboard JSON',
				name: 'inlineKeyboardJSON',
				placeholder: 'Add Custom Inline Keyboard',
				description: 'Adds an inline keyboard via JSON',
				type: 'json',
				displayOptions: {
					show: {
						replyMarkup: ['inlineKeyboardJSON'],
					},
				},
				default: `[
  [
    {
        "text": "1 button of the first row",
        "callback_data": "11"
    },
    {
        "text": "2 button of the first row",
        "callback_data": "21"
    }
  ],
  [
    {
        "text": "1 button of the second row",
        "callback_data": "12"
    },
    {
        "text": "2 button of the second row",
        "callback_data": "22"
    }
  ],
  [
    {
        "text": "link in the third row",
        "url": "https://www.youtube.com/watch?v=vuvckBQ1bME"
    }
  ]
]`,
			},



			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: [
							'editMessageText',
							'sendMessage',
						],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Disable Notification',
						name: 'disable_notification',
						type: 'boolean',
						default: false,
						displayOptions: {
							hide: {
								'/operation': ['editMessageText'],
							},
						},
						description:
							'Whether to send the message silently. Users will receive a notification with no sound.',
					},
					{
						displayName: 'Disable WebPage Preview',
						name: 'disable_web_page_preview',
						type: 'boolean',
						displayOptions: {
							show: {
								'/operation': ['editMessageText', 'sendMessage'],
							},
						},
						default: false,
						description: 'Whether to disable link previews for links in this message',
					},
					{
						displayName: 'Reply To Message ID',
						name: 'reply_to_message_id',
						type: 'number',
						displayOptions: {
							hide: {
								'/operation': ['editMessageText'],
							},
						},
						default: 0,
						description: 'If the message is a reply, ID of the original message',
					},
					{
						displayName: 'Message Thread ID',
						name: 'message_thread_id',
						type: 'number',
						displayOptions: {
							show: {
								'/operation': [
									'sendMessage',
								],
							},
						},
						default: 0,
						description: 'The unique identifier of the forum topic',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// For Post
		let body: IDataObject;
		// For Query string
		let qs: IDataObject;

		let requestMethod: IHttpRequestMethods;
		let endpoint: string;

		const operation = this.getNodeParameter('operation', 0);
		const binaryData = this.getNodeParameter('binaryData', 0, false);

		const nodeVersion = this.getNode().typeVersion;
		const instanceId = this.getInstanceId();

		for (let i = 0; i < items.length; i++) {
			try {
				// Reset all values
				requestMethod = 'POST';
				endpoint = '';
				body = {};
				qs = {};

					if (operation === 'editMessageText') {
						// ----------------------------------
						//         message:editMessageText
						// ----------------------------------

						endpoint = 'editMessageText';

						const messageType = this.getNodeParameter('messageType', i) as string;

						if (messageType === 'inlineMessage') {
							body.inline_message_id = this.getNodeParameter('inlineMessageId', i) as string;
						} else {
							body.chat_id = this.getNodeParameter('chatId', i) as string;
							body.message_id = this.getNodeParameter('messageId', i) as string;
						}

						body.text = this.getNodeParameter('text', i) as string;

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i);
					} else if (operation === 'sendMessage') {
						// ----------------------------------
						//         message:sendMessage
						// ----------------------------------

						endpoint = 'sendMessage';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.text = this.getNodeParameter('text', i) as string;

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i, nodeVersion, instanceId);
					}


				let responseData;

				if (binaryData) {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0);
					const itemBinaryData = items[i].binary![binaryPropertyName];
					const propertyName = getPropertyName(operation);
					const fileName = this.getNodeParameter('additionalFields.fileName', 0, '') as string;

					const filename = fileName || itemBinaryData.fileName?.toString();

					if (!fileName && !itemBinaryData.fileName) {
						throw new NodeOperationError(
							this.getNode(),
							`File name is needed to ${operation}. Make sure the property that holds the binary data
						has the file name property set or set it manually in the node using the File Name parameter under
						Additional Fields.`,
						);
					}

					body.disable_notification = body.disable_notification?.toString() || 'false';

					let uploadData: Buffer | Readable;
					if (itemBinaryData.id) {
						uploadData = await this.helpers.getBinaryStream(itemBinaryData.id);
					} else {
						uploadData = Buffer.from(itemBinaryData.data, BINARY_ENCODING);
					}

					const formData = {
						...body,
						[propertyName]: {
							value: uploadData,
							options: {
								filename,
								contentType: itemBinaryData.mimeType,
							},
						},
					};

					responseData = await apiRequest.call(this, requestMethod, endpoint, {}, qs, { formData });
				} else {
					responseData = await apiRequest.call(this, requestMethod, endpoint, body, qs);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject[]),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: {}, error: error.message });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
