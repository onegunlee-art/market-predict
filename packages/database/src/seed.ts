import { PrismaClient, UserRole, MarketCategory, MarketStatus, ContentStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hashPassword('admin123!@#');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@market-predict.com' },
    update: {},
    create: {
      email: 'admin@market-predict.com',
      passwordHash: adminPassword,
      username: 'admin',
      displayName: 'System Admin',
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      balance: 100000,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create test users
  const testPassword = await hashPassword('test123!@#');
  const testUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'user1@test.com' },
      update: {},
      create: {
        email: 'user1@test.com',
        passwordHash: testPassword,
        username: 'kpop_fan',
        displayName: 'K-POP Fan',
        role: UserRole.USER,
        emailVerified: true,
        balance: 10000,
        reputationScore: 100,
      },
    }),
    prisma.user.upsert({
      where: { email: 'user2@test.com' },
      update: {},
      create: {
        email: 'user2@test.com',
        passwordHash: testPassword,
        username: 'movie_buff',
        displayName: 'Movie Buff',
        role: UserRole.USER,
        emailVerified: true,
        balance: 10000,
        reputationScore: 50,
      },
    }),
    prisma.user.upsert({
      where: { email: 'analyst@test.com' },
      update: {},
      create: {
        email: 'analyst@test.com',
        passwordHash: testPassword,
        username: 'data_analyst',
        displayName: 'Data Analyst',
        role: UserRole.ANALYST,
        emailVerified: true,
        balance: 10000,
      },
    }),
  ]);
  console.log('✅ Test users created:', testUsers.length);

  // Create sample content
  const contents = await Promise.all([
    prisma.content.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        title: 'BTS New Album 2026',
        description: 'BTS upcoming album release in 2026',
        category: MarketCategory.KPOP,
        status: ContentStatus.APPROVED,
        imageUrl: 'https://via.placeholder.com/400x400?text=BTS',
        metadata: {
          artist: 'BTS',
          type: 'album',
        },
      },
    }),
    prisma.content.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        title: 'Dune: Part Three',
        description: 'The third installment of the Dune franchise',
        category: MarketCategory.MOVIE,
        status: ContentStatus.APPROVED,
        imageUrl: 'https://via.placeholder.com/400x600?text=Dune3',
        metadata: {
          director: 'Denis Villeneuve',
          type: 'movie',
        },
      },
    }),
    prisma.content.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        title: 'Squid Game Season 3',
        description: 'The third season of the hit Netflix series',
        category: MarketCategory.DRAMA,
        status: ContentStatus.APPROVED,
        imageUrl: 'https://via.placeholder.com/400x600?text=SquidGame3',
        metadata: {
          platform: 'Netflix',
          type: 'drama',
        },
      },
    }),
  ]);
  console.log('✅ Sample content created:', contents.length);

  // Create sample markets
  const markets = await Promise.all([
    prisma.market.upsert({
      where: { id: '00000000-0000-0000-0000-000000000101' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000101',
        contentId: contents[0].id,
        question: 'Will BTS new album sell over 5 million copies in the first week?',
        description: 'Based on first week sales data from Hanteo/Circle charts',
        category: MarketCategory.KPOP,
        probability: 0.65,
        liquidityParam: 100,
        status: MarketStatus.ACTIVE,
        closesAt: new Date('2026-12-31'),
        createdBy: admin.id,
      },
    }),
    prisma.market.upsert({
      where: { id: '00000000-0000-0000-0000-000000000102' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000102',
        contentId: contents[1].id,
        question: 'Will Dune: Part Three gross over $1 billion worldwide?',
        description: 'Based on worldwide box office total',
        category: MarketCategory.MOVIE,
        probability: 0.45,
        liquidityParam: 100,
        status: MarketStatus.ACTIVE,
        closesAt: new Date('2027-06-30'),
        createdBy: admin.id,
      },
    }),
    prisma.market.upsert({
      where: { id: '00000000-0000-0000-0000-000000000103' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000103',
        contentId: contents[2].id,
        question: 'Will Squid Game Season 3 break the Season 1 viewership record?',
        description: 'Based on Netflix viewership hours in the first 28 days',
        category: MarketCategory.DRAMA,
        probability: 0.35,
        liquidityParam: 100,
        status: MarketStatus.ACTIVE,
        closesAt: new Date('2026-12-31'),
        createdBy: admin.id,
      },
    }),
  ]);
  console.log('✅ Sample markets created:', markets.length);

  // Create permissions
  const resources = ['users', 'markets', 'content', 'analytics', 'ai', 'system'];
  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'] as const;

  for (const resource of resources) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { name: `${resource}:${action.toLowerCase()}` },
        update: {},
        create: {
          name: `${resource}:${action.toLowerCase()}`,
          description: `${action} permission for ${resource}`,
          resource,
          action,
        },
      });
    }
  }
  console.log('✅ Permissions created');

  // Create menu items
  const menuItems = [
    { label: 'Dashboard', icon: 'LayoutDashboard', route: '/dashboard', order: 0 },
    { label: 'Users', icon: 'Users', route: '/users', order: 1 },
    { label: 'Markets', icon: 'TrendingUp', route: '/markets', order: 2 },
    { label: 'Content', icon: 'FileText', route: '/content', order: 3 },
    { label: 'Moderation', icon: 'Shield', route: '/moderation', order: 4 },
    { label: 'Analytics', icon: 'BarChart3', route: '/analytics', order: 5 },
    { label: 'AI Engine', icon: 'Brain', route: '/ai', order: 6 },
    { label: 'CMS', icon: 'Layers', route: '/cms', order: 7 },
    { label: 'Settings', icon: 'Settings', route: '/settings', order: 8 },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: `menu-${item.label.toLowerCase()}` },
      update: {},
      create: {
        id: `menu-${item.label.toLowerCase()}`,
        ...item,
        visibleToRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
    });
  }
  console.log('✅ Menu items created');

  // Create AI priors for markets
  for (const market of markets) {
    await prisma.aIPrior.create({
      data: {
        marketId: market.id,
        probability: Number(market.probability),
        confidence: 0.7,
        modelVersion: 'v1.0.0',
        features: {
          historicalData: true,
          sentimentAnalysis: true,
          trendSignals: false,
        },
        explanation: 'Initial AI prior based on historical data analysis',
      },
    });
  }
  console.log('✅ AI priors created');

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
