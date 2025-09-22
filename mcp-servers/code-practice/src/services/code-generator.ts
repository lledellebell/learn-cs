import { z } from 'zod';

const GenerateAlgorithmSchema = z.object({
  algorithm: z.string(),
  language: z.enum(['javascript', 'typescript', 'python', 'java', 'cpp']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  includeTests: z.boolean().default(true),
});

type GenerateAlgorithmParams = z.infer<typeof GenerateAlgorithmSchema>;

interface CodeImplementation {
  code: string;
  explanation: string;
  complexity: { time: string; space: string; };
}

interface LanguageImplementations {
  [key: string]: CodeImplementation;
}

interface CodeBank {
  [key: string]: LanguageImplementations;
}

const codeBank: CodeBank = {
  'binary-search': {
    'typescript': {
      code: `function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) {
      return mid;
    }
    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}`,
      explanation: '이진 탐색은 정렬된 배열에서 특정 값을 찾는 효율적인 알고리즘입니다. 시간 복잡도는 O(log n)입니다.',
      complexity: { time: 'O(log n)', space: 'O(1)' },
    },
  },
  'quick-sort': {
    'typescript': {
      code: `function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) {
    return arr;
  }

  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];

  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] < pivot) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }

  return [...quickSort(left), pivot, ...quickSort(right)];
}`,
      explanation: '퀵 정렬은 분할 정복 전략을 사용하는 효율적인 정렬 알고리즘입니다. 평균 시간 복잡도는 O(n log n)입니다.',
      complexity: { time: 'O(n log n)', space: 'O(log n)' },
    },
  },
  'linked-list': {
    'typescript': {
        code: `class ListNode {
    val: number;
    next: ListNode | null;
    constructor(val?: number, next?: ListNode | null) {
        this.val = (val===undefined ? 0 : val)
        this.next = (next===undefined ? null : next)
    }
}

class LinkedList {
    head: ListNode | null;

    constructor() {
        this.head = null;
    }

    append(val: number): void {
        const newNode = new ListNode(val);
        if (!this.head) {
            this.head = newNode;
            return;
        }
        let current = this.head;
        while (current.next) {
            current = current.next;
        }
        current.next = newNode;
    }
}`,
        explanation: '연결 리스트는 각 노드가 데이터와 다음 노드를 가리키는 포인터를 포함하는 선형 자료구조입니다.',
        complexity: { time: 'O(n) for access', space: 'O(n)' },
    }
  }
};

export class CodeGenerator {
  async generateAlgorithm(args: unknown) {
    const params = GenerateAlgorithmSchema.parse(args);
    const algorithmKey = params.algorithm.toLowerCase().replace(/\s+/g, '-');
    const lang = params.language;

    const implementation = codeBank[algorithmKey]?.[lang];

    if (!implementation) {
      return {
        tool_name: 'generate_algorithm_code',
        output: {
          error: `'${params.algorithm}' 알고리즘에 대한 '${lang}' 구현을 찾을 수 없습니다.`,
        },
      };
    }

    // TODO: Add test case generation logic
    const testCases = params.includeTests ? `// ${params.algorithm}에 대한 테스트 케이스 예시` : undefined;

    return {
      tool_name: 'generate_algorithm_code',
      output: {
        language: lang,
        code: implementation.code,
        explanation: implementation.explanation,
        complexity: implementation.complexity,
        testCases: testCases,
      },
    };
  }

  async getDataStructureTemplates() {
    // TODO: Implement logic to provide data structure templates
    return {
      resource_uri: 'learn-cs://data-structures',
      content: {
        templates: [
          { name: 'LinkedList', language: 'typescript' },
          { name: 'BinaryTree', language: 'typescript' },
          { name: 'HashTable', language: 'typescript' },
        ],
      },
      mimeType: 'application/json',
    };
  }
}
