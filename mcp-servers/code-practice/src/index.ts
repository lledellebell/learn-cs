#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { CodeGenerator } from './services/code-generator';
import { CodeAnalyzer } from './services/code-analyzer';
import { TestGenerator } from './services/test-generator';
import { AlgorithmPractice } from './services/algorithm-practice';

/**
 * Learn-CS, (MCP Server) Code Practice 
 * 
 * 이 서버는 learn-cs 프로젝트를 위한 코드 실습, 분석, 생성 도구를 제공합니다.
 * 
 * 주요 기능:
 * - 알고리즘 및 자료구조 코드 생성
 * - 코드 품질 분석 및 최적화 제안
 * - 자동 테스트 케이스 생성
 */

class CodePracticeMCPServer {
  private server: Server;
  private codeGenerator: CodeGenerator;
  private codeAnalyzer: CodeAnalyzer;
  private testGenerator: TestGenerator;
  private algorithmPractice: AlgorithmPractice;
  
  constructor() {
    this.server = new Server(
      {
        name: 'learn-cs-code-practice',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // 서비스 초기화
    this.codeGenerator = new CodeGenerator();
    this.codeAnalyzer = new CodeAnalyzer();
    this.testGenerator = new TestGenerator();
    this.algorithmPractice = new AlgorithmPractice();
    
    this.setupHandlers();
  }

  private setupHandlers() {
    // 리소스 목록 제공
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'learn-cs://algorithms',
            name: '알고리즘 연습 문제',
            description: 'learn-cs 콘텐츠 기반으로 생성된 알고리즘 연습 문제입니다.',
            mimeType: 'application/json',
          },
          {
            uri: 'learn-cs://data-structures',
            name: '자료구조 구현체',
            description: '다양한 자료구조의 코드 구현체를 제공합니다.',
            mimeType: 'application/json',
          },
          {
            uri: 'learn-cs://code-analysis',
            name: '코드 품질 분석',
            description: '코드 품질, 성능, 모범 사례에 대한 분석 결과입니다.',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // 도구 목록 제공
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate_algorithm_code',
            description: '알고리즘 구현 코드와 설명, 복잡도 분석을 생성합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                algorithm: {
                  type: 'string',
                  description: '구현할 알고리즘의 이름',
                },
                language: {
                  type: 'string',
                  enum: ['javascript', 'typescript', 'python', 'java', 'cpp'],
                  description: '구현에 사용할 프로그래밍 언어',
                },
                difficulty: {
                  type: 'string',
                  enum: ['beginner', 'intermediate', 'advanced'],
                  description: '구현의 난이도',
                },
                includeTests: {
                  type: 'boolean',
                  description: '테스트 케이스 포함 여부',
                  default: true,
                },
              },
              required: ['algorithm', 'language'],
            },
          },
          {
            name: 'analyze_code_quality',
            description: '코드의 품질, 성능, 모범 사례를 분석합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: '분석할 코드',
                },
                language: {
                  type: 'string',
                  enum: ['javascript', 'typescript', 'python', 'java', 'cpp'],
                  description: '코드의 프로그래밍 언어',
                },
                analysisType: {
                  type: 'string',
                  enum: ['quality', 'performance', 'security', 'all'],
                  description: '수행할 분석 유형',
                  default: 'all',
                },
              },
              required: ['code', 'language'],
            },
          },
          {
            name: 'generate_test_cases',
            description: '주어진 코드에 대한 포괄적인 테스트 케이스를 생성합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: '테스트를 생성할 코드',
                },
                language: {
                  type: 'string',
                  enum: ['javascript', 'typescript', 'python', 'java'],
                  description: '프로그래밍 언어',
                },
                testFramework: {
                  type: 'string',
                  enum: ['jest', 'mocha', 'pytest', 'junit'],
                  description: '사용할 테스트 프레임워크',
                },
                coverage: {
                  type: 'string',
                  enum: ['basic', 'comprehensive', 'edge-cases'],
                  description: '테스트 커버리지 수준',
                  default: 'comprehensive',
                },
              },
              required: ['code', 'language'],
            },
          },
          {
            name: 'create_practice_problem',
            description: '현재 학습 주제를 기반으로 연습 문제를 생성합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: '학습 주제 또는 개념',
                },
                difficulty: {
                  type: 'string',
                  enum: ['easy', 'medium', 'hard'],
                  description: '문제 난이도',
                },
                problemType: {
                  type: 'string',
                  enum: ['algorithm', 'data-structure', 'web-dev', 'system-design'],
                  description: '생성할 문제 유형',
                },
                includeHints: {
                  type: 'boolean',
                  description: '힌트 포함 여부',
                  default: true,
                },
              },
              required: ['topic', 'problemType'],
            },
          },
                  ],
      };
    });

    // 리소스 읽기 핸들러
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      switch (uri) {
        case 'learn-cs://algorithms':
          return await this.algorithmPractice.getAvailableProblems();
        case 'learn-cs://data-structures':
          return await this.codeGenerator.getDataStructureTemplates();
        case 'learn-cs://code-analysis':
          return await this.codeAnalyzer.getAnalysisHistory();
        default:
          throw new Error(`${uri}는 유효하지 않습니다.`);
      }
    });

    // 도구 실행 핸들러
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'generate_algorithm_code':
          return await this.codeGenerator.generateAlgorithm(args);
        
        case 'analyze_code_quality':
          return await this.codeAnalyzer.analyzeCode(args);
        
        case 'generate_test_cases':
          return await this.testGenerator.generateTests(args);
        
        case 'create_practice_problem':
          return await this.algorithmPractice.createProblem(args);
        
                
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Code Practice MCP Server를 실행합니다.');
  }
}

// 서버 시작
const server = new CodePracticeMCPServer();
server.start().catch((error) => {
  console.error('서버 실행 중 오류가 발생했습니다.:', error);
  process.exit(1);
});
