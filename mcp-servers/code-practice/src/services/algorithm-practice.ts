import { z } from 'zod';

const CreateProblemSchema = z.object({
  topic: z.string(),
  problemType: z.enum(['algorithm', 'data-structure', 'web-dev', 'system-design']),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  includeHints: z.boolean().default(true),
});

type CreateProblemParams = z.infer<typeof CreateProblemSchema>;

interface Problem {
  difficulty: 'easy' | 'medium' | 'hard';
  problemStatement: string;
  hints: string[];
}

const problemBank: { [key: string]: Problem[] } = {
  'sorting': [
    {
      difficulty: 'easy',
      problemStatement: '숫자 배열을 오름차순으로 정렬하는 함수를 작성하세요.',
      hints: ['버블 정렬이나 선택 정렬과 같은 간단한 정렬 알고리즘을 사용해보세요.'],
    },
    {
      difficulty: 'medium',
      problemStatement: '객체 배열을 특정 키 값에 따라 정렬하는 함수를 작성하세요.',
      hints: ['Array.prototype.sort() 메서드의 비교 함수를 활용해보세요.'],
    },
  ],
  'searching': [
    {
      difficulty: 'easy',
      problemStatement: '정렬된 숫자 배열에서 특정 값의 인덱스를 찾는 함수를 작성하세요.',
      hints: ['이진 탐색 알고리즘이 효율적입니다.'],
    },
  ],
};

export class AlgorithmPractice {
  async createProblem(args: unknown) {
    const params = CreateProblemSchema.parse(args);
    const topic = params.topic.toLowerCase();
    const availableProblems = problemBank[topic] || [];

    if (availableProblems.length === 0) {
      return {
        tool_name: 'create_practice_problem',
        output: {
          error: `'${params.topic}' 주제에 대한 문제를 찾을 수 없습니다.`,
        },
      };
    }

    let filteredProblems = availableProblems;
    if (params.difficulty) {
      filteredProblems = availableProblems.filter((p: Problem) => p.difficulty === params.difficulty);
    }

    if (filteredProblems.length === 0) {
        return {
            tool_name: 'create_practice_problem',
            output: {
                error: `'${params.topic}' 주제의 '${params.difficulty}' 난이도 문제를 찾을 수 없습니다.`,
            },
        };
    }

    const problem = filteredProblems[Math.floor(Math.random() * filteredProblems.length)];

    return {
      tool_name: 'create_practice_problem',
      output: {
        topic: params.topic,
        difficulty: problem.difficulty,
        problemStatement: problem.problemStatement,
        hints: params.includeHints ? problem.hints : undefined,
      },
    };
  }

  async getAvailableProblems() {
    // TODO: Implement logic to provide available problems
    return {
      resource_uri: 'learn-cs://algorithms',
      content: {
        problems: [
          { id: 'problem-1', topic: 'Sorting', difficulty: 'easy' },
          { id: 'problem-2', topic: 'Graph Traversal', difficulty: 'medium' },
        ],
      },
      mimeType: 'application/json',
    };
  }
}
