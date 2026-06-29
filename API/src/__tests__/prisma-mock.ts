import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended'
import type { PrismaClient } from '@prisma/client'

// Singleton mock reutilizado dentro de cada worker de teste.
// Cada arquivo de teste chama mockReset(prismaMock) no beforeEach.
export const prismaMock = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>
