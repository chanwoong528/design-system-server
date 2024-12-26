// EndType =["textNode”, “imageNode”]
// {
//   "dom": {
//       "markupType": "button",
//       "children": [
//           {
//               "markupType": "img",
//               "children": [
//                   {
//                       "markupType": "div",
//                       "children": []
//                   }
//               ]
//           },
//           {
//               "markupType": "span",
//               "children": []
//           },
//           {
//               "markupType": "img",
//               "children": [
//                   {
//                       "markupType": "div",
//                       "children": []
//                   }
//               ]
//           }
//       ]
//   }
// }

export class DomProps {
  markupType: string;
  children: DomProps[];
}

export class JsonNodeProps {
  name: string;
  type: string;

  value?: string;
  styleText?: Record<string, any>;
  children?: JsonNodeProps[];
}

export class ReqBodyJsonParser {
  // jsonList: JsonNodeProps[];
  dom: DomProps;
  style: Record<string, any>;
}

export class ParsedResult {
  code: number;
  message: string;
}
