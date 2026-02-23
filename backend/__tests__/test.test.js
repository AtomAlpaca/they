const mongoose = require('mongoose');
const app = require('../server');
const request = require('supertest');

let testUser = { email: 'testuser@test.com', password: 'testpass123', username: 'testuser' };

const verifyToken = async (token, expectedEmail) => {
    const secret = process.env.JWT_SECRET;
    const { jwtVerify } = require('jose');
    const decoded = await jwtVerify(token, new TextEncoder().encode(secret));
    return decoded.payload.email === expectedEmail;
};

describe('Auth API Tests', () => {
    beforeAll(async () => {
        jest.setTimeout(10000);
        try {
            await mongoose.disconnect();
            const uri = "mongodb://localhost:27017/test_auth_db";
            const conn = await mongoose.connect(uri, {});
            await mongoose.connection.dropDatabase();
            console.log(`MongoDB Connected: ${conn.connection.host}`);
        } catch (error) {
            console.error('Error connecting to MongoDB:', error.message);
        }
    });

    afterAll(async () => {
        try {
            await mongoose.connection.dropDatabase();
            await mongoose.disconnect();
        } catch (error) {
            console.error('Error disconnecting:', error.message);
        }
    });
    
    beforeEach(() => {
        return new Promise(resolve => setTimeout(resolve, 1000));
    });
    
    describe('User Registration', () => {
        test('Register with valid data', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ 
                    username: testUser.username, 
                    email: testUser.email, 
                    password: testUser.password 
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('User registered successfully');
        });

        test('Register with duplicate email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ 
                    username: 'anotheruser', 
                    email: testUser.email, 
                    password: 'password123' 
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('User with this email already exists.');
        });

        test('Register with duplicate username', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ 
                    username: testUser.username, 
                    email: 'another@test.com', 
                    password: 'password123' 
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('User with this username already exists.');
        });

        test('Register with empty email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ 
                    username: 'newuser', 
                    email: '', 
                    password: 'password123' 
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('Register with empty username', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ 
                    username: '', 
                    email: 'new@test.com', 
                    password: 'password123' 
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('Register with empty password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ 
                    username: 'newuser2', 
                    email: 'new2@test.com', 
                    password: '' 
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('User Login', () => {
        test('Login with correct email and password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ 
                    email: testUser.email, 
                    password: testUser.password 
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.jwt).toBeDefined();
            
            const isValid = await verifyToken(res.body.jwt, testUser.email);
            expect(isValid).toBe(true);
        });

        test('Login with correct username and password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ 
                    username: testUser.username, 
                    password: testUser.password 
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.jwt).toBeDefined();
        });

        test('Login with non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ 
                    email: 'nonexistent@test.com', 
                    password: 'password123' 
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('The user does not exist');
        });

        test('Login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ 
                    email: testUser.email, 
                    password: 'wrongpassword' 
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('The password is wrong');
        });

        test('Login without credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Please input your username or email');
        });
    });

    describe('Profile', () => {
        let profileToken = '';

        beforeAll(async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });
            profileToken = res.body.jwt;
        });

        test('Get profile', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${profileToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.username).toBe(testUser.username);
            expect(res.body.data.email).toBe(testUser.email);
        });

        test('Get profile without token', async () => {
            const res = await request(app)
                .get('/api/auth/profile');

            expect(res.status).toBe(401);
        });

        test('Update profile', async () => {
            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${profileToken}`)
                .send({ 
                    profile: { 
                        firstName: 'Test', 
                        lastName: 'User' 
                    } 
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});


describe('Teacher Rating API Tests', () => {
    beforeAll(async () => {
        try {
            await mongoose.disconnect()
            const uri = "mongodb://localhost:27017/test_db";
            const conn = await mongoose.connect(uri, {});
            await mongoose.connection.dropDatabase()
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            
            // Import server after DB connection
            server = require('../server');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error.message);
            process.exit(1);
        }
    })

    afterAll(async () => {
        try {
            await mongoose.connection.dropDatabase()
            await mongoose.disconnect()
        } catch (error) {
            console.error('Error disconnecting:', error.message);
        }
    })

    beforeEach(() => {
        return new Promise(resolve => setTimeout(resolve, 1000));
    });

    test('Register admin user', async () => {
        const res = await request(server)
            .post('/api/auth/register')
            .send({ username: 'admin', email: 'admin@test.com', password: 'admin123' });
        expect(res.status).toBe(201);
        
        await mongoose.connection.collection('userrepos').updateOne(
            { email: 'admin@test.com' },
            { $set: { role: 'admin' } }
        );
    })

    test('Register normal user', async () => {
        const res = await request(server)
            .post('/api/auth/register')
            .send({ username: 'user1', email: 'user1@test.com', password: 'user123' });
        expect(res.status).toBe(201);
    })

    test('Register normal user2', async () => {
        const res = await request(server)
            .post('/api/auth/register')
            .send({ username: 'user2', email: 'user2@test.com', password: 'user123' });
        expect(res.status).toBe(201);
    })

    test('Login as admin', async () => {
        const res = await request(server)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'admin123' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        adminToken = res.body.jwt;
    })

    test('Login as normal user', async () => {
        const res = await request(server)
            .post('/api/auth/login')
            .send({ email: 'user1@test.com', password: 'user123' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        userToken = res.body.jwt;
    })

    test('Login as normal user', async () => {
        const res = await request(server)
            .post('/api/auth/login')
            .send({ email: 'user2@test.com', password: 'user123' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        user2Token = res.body.jwt;
    })

    test('Admin creates a teacher', async () => {
        const res = await request(server)
            .post('/api/admin/teachers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: '张老师', description: '数学教授' });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        teacherId = res.body.data._id;
    })

    test('Get teacher list', async () => {
        const res = await request(server)
            .get('/api/teachers');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    })

    test('Get teacher by id', async () => {
        const res = await request(server)
            .get(`/api/teachers/${teacherId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('张老师');
    })

    test('Search teachers', async () => {
        const res = await request(server)
            .get('/api/teachers?search=张');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    })

    test('Submit rating', async () => {
        const res = await request(server)
            .post('/api/ratings')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                teacherId: teacherId,
                rating: 5,
                comment: '张老师讲课非常好，知识点讲解清晰，很有帮助！',
                isAnonymous: false
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    })

    test('Get ratings for teacher', async () => {
        const res = await request(server)
            .get(`/api/teachers/${teacherId}/ratings`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
    })

    test('Get my ratings', async () => {
        const res = await request(server)
            .get('/api/ratings/my')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
    })

    test('Submit rating with short comment', async () => {
        const res = await request(server)
            .post('/api/ratings')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                teacherId: teacherId,
                rating: 4,
                comment: '好',
                isAnonymous: false
            });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    })

    test('Submit a new teacher request', async () => {
        const res = await request(server)
            .post('/api/submissions')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: '李老师',
                description: '物理系副教授'
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('投稿成功，等待审核');
        submissionId = res.body.data._id;
    })

    test('Get my submissions', async () => {
        const res = await request(server)
            .get('/api/submissions/my')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].name).toBe('李老师');
    })

    test('Submit duplicate teacher name', async () => {
        const res = await request(server)
            .post('/api/submissions')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: '张老师',
                description: '测试'
            });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    })

    test('Admin gets pending submissions', async () => {
        const res = await request(server)
            .get('/api/admin/submissions')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
    })

    test('Admin approves submission', async () => {
        const res = await request(server)
            .post(`/api/admin/submissions/${submissionId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ adminNote: '审核通过' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    })

    test('Verify teacher was added', async () => {
        const res = await request(server)
            .get('/api/teachers?search=李老师');
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
    })

    test('Admin gets all users', async () => {
        const res = await request(server)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(3);
    })

    test('Admin gets all ratings', async () => {
        const res = await request(server)
            .get('/api/admin/ratings')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    })

    test('Admin deletes a rating', async () => {
        const ratingsRes = await request(server)
            .get('/api/admin/ratings')
            .set('Authorization', `Bearer ${adminToken}`);
        const ratingId = ratingsRes.body.data[0]._id;

        const res = await request(server)
            .delete(`/api/admin/ratings/${ratingId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    })

    test('Admin deletes a teacher', async () => {
        const res = await request(server)
            .delete(`/api/admin/teachers/${teacherId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    })

    test('Update user profile', async () => {
        const res = await request(server)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                profile: {
                    firstName: '测试',
                    lastName: '用户'
                }
            });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    })

    test('Verify profile update', async () => {
        const res = await request(server)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.profile.firstName).toBe('测试');
    })

    describe('Teacher CRUD Operations', () => {
        test('Admin creates a teacher', async () => {
            const res = await request(server)
                .post('/api/admin/teachers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: '张老师', description: '数学教授' });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            teacherId = res.body.data._id;
        });

        test('Get teacher list', async () => {
            const res = await request(server)
                .get('/api/teachers');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        test('Get teacher by valid id', async () => {
            const res = await request(server)
                .get(`/api/teachers/${teacherId}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('张老师');
        });

        test('Get teacher by invalid id format', async () => {
            const res = await request(server)
                .get('/api/teachers/invalid-id-123');
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('Get teacher by non-existent id', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(server)
                .get(`/api/teachers/${fakeId}`);
            expect(res.status).toBe(404);
        });

        test('Search teachers by name', async () => {
            const res = await request(server)
                .get('/api/teachers?search=张');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('Search with special regex characters', async () => {
            const res = await request(server)
                .get('/api/teachers?search=.*+?^${}()|[]\\');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('Search with empty string returns all', async () => {
            const res = await request(server)
                .get('/api/teachers?search=');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('Pagination Tests', () => {
        test('Get teachers with default pagination', async () => {
            const res = await request(server)
                .get('/api/teachers');
            expect(res.status).toBe(200);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(20);
        });

        test('Get teachers with custom page and limit', async () => {
            const res = await request(server)
                .get('/api/teachers?page=2&limit=5');
            expect(res.status).toBe(200);
            expect(res.body.pagination.page).toBe(2);
            expect(res.body.pagination.limit).toBe(5);
        });

        test('Pagination with invalid page defaults to 1', async () => {
            const res = await request(server)
                .get('/api/teachers?page=abc&limit=10');
            expect(res.status).toBe(200);
            expect(res.body.pagination.page).toBe(1);
        });

        test('Pagination with negative page defaults to 1', async () => {
            const res = await request(server)
                .get('/api/teachers?page=-5&limit=10');
            expect(res.status).toBe(200);
            expect(res.body.pagination.page).toBe(1);
        });

        test('Pagination with limit exceeding max (100)', async () => {
            const res = await request(server)
                .get('/api/teachers?page=1&limit=500');
            expect(res.status).toBe(200);
            expect(res.body.pagination.limit).toBe(100);
        });

        test('Pagination with limit less than 1 defaults to 1', async () => {
            const res = await request(server)
                .get('/api/teachers?page=1&limit=-5');
            expect(res.status).toBe(200);
            expect(res.body.pagination.limit).toBe(1);
        });

        test('Pagination with zero limit uses default', async () => {
            const res = await request(server)
                .get('/api/teachers?page=1&limit=0');
            expect(res.status).toBe(200);
            expect(res.body.pagination.limit).toBe(20);
        });

        test('Pagination response includes correct total', async () => {
            const res = await request(server)
                .get('/api/teachers');
            expect(res.status).toBe(200);
            expect(res.body.pagination.total).toBeDefined();
            expect(typeof res.body.pagination.total).toBe('number');
        });

        test('Pagination response includes pages count', async () => {
            const res = await request(server)
                .get('/api/teachers');
            expect(res.status).toBe(200);
            expect(res.body.pagination.pages).toBeDefined();
            expect(typeof res.body.pagination.pages).toBe('number');
        });
    });

    describe('Rating Tests', () => {
        test('Submit rating with short comment fails (another user)', async () => {
            const res = await request(server)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${user2Token}`)
                .send({
                    teacherId: teacherId,
                    rating: 4,
                    comment: '短'
                });
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('The comment is too short');
        });

        test('Submit valid rating', async () => {
            const res = await request(server)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    teacherId: teacherId,
                    rating: 5,
                    comment: '张老师讲课非常好，知识点讲解清晰，很有帮助！',
                    isAnonymous: false
                });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        test('Submit rating with invalid teacher id format', async () => {
            const res = await request(server)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    teacherId: 'invalid-id',
                    rating: 5,
                    comment: '这是一条很长的评价内容用于测试评分功能是否正常工作。'
                });
            expect(res.status).toBe(400);
        });

        test('Submit duplicate rating fails', async () => {
            const res = await request(server)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    teacherId: teacherId,
                    rating: 4,
                    comment: '这是一个重复的评价用于测试防止重复评分功能。'
                });
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('The user had already rated this teacher');
        });

        test('Submit rating with rating 1', async () => {
            const res = await request(server)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${user2Token}`)
                .send({
                    teacherId: teacherId,
                    rating: 1,
                    comment: '老师讲课不太好，希望可以改进。',
                    isAnonymous: false
                });
            expect(res.status).toBe(201);
        });

        test('Submit rating with rating 3', async () => {
            const res = await request(server)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    teacherId: teacherId,
                    rating: 3,
                    comment: '中规中矩的老师，还可以接受。'
                });
            expect(res.status).toBe(401);
        });

        test('Submit rating with invalid rating (0)', async () => {
            const res = await request(server)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${user2Token}`)
                .send({
                    teacherId: teacherId,
                    rating: 0,
                    comment: '评分不能为零，这是一条测试评价内容。'
                });
            expect(res.status).toBe(401);
        });

        test('Submit rating with invalid rating (6)', async () => {
            const res = await request(server)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${user2Token}`)
                .send({
                    teacherId: teacherId,
                    rating: 6,
                    comment: '评分超出范围，这是一条测试评价内容。'
                });
            expect(res.status).toBe(401);
        });



        test('Submit anonymous rating', async () => {
            const res = await request(server)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    teacherId: teacherId,
                    rating: 5,
                    comment: '这是一条匿名的评价内容，用于测试匿名功能是否正常工作。',
                    isAnonymous: true
                });
            expect(res.status).toBe(401);
        });

        test('Get ratings for teacher', async () => {
            const res = await request(server)
                .get(`/api/teachers/${teacherId}/ratings`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        test('Get ratings with pagination', async () => {
            const res = await request(server)
                .get(`/api/teachers/${teacherId}/ratings?page=1&limit=10`);
            expect(res.status).toBe(200);
            expect(res.body.pagination).toBeDefined();
        });

        test('Get my ratings', async () => {
            const res = await request(server)
                .get('/api/ratings/my')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        test('Get my ratings without token fails', async () => {
            const res = await request(server)
                .get('/api/ratings/my');
            expect(res.status).toBe(401);
        });
    });

    describe('Admin Operations Tests', () => {
        beforeAll (async () => {
            const loginRes = await request(server)
                .post('/api/auth/login')
                .send({ email: 'user1@test.com', password: 'user123' });
            userId = loginRes.body.user.id;
        })
        test('Admin gets all teachers', async () => {
            const res = await request(server)
                .get('/api/admin/teachers')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('Admin gets all users', async () => {
            const res = await request(server)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('Admin gets all ratings', async () => {
            const res = await request(server)
                .get('/api/admin/ratings')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('Admin bans user', async () => {


            const res = await request(server)
                .post(`/api/admin/users/${userId}/toggle`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        test('Banned user cannot login', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({ email: 'user1@test.com', password: 'user123' });
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('This user was banned by admin');
        });

        test('Admin unbans user', async () => {

            const res = await request(server)
                .post(`/api/admin/users/${userId}/toggle`)
                .set('Authorization', `Bearer ${adminToken}`);
            console.log(res.body)
            expect(res.status).toBe(200);
        });

        test('Unbanned user can login again', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({ email: 'user1@test.com', password: 'user123' });
            expect(res.status).toBe(200);
        });

        test('Admin deletes a rating', async () => {
            const ratingsRes = await request(server)
                .get('/api/admin/ratings')
                .set('Authorization', `Bearer ${adminToken}`);
            const ratingId = ratingsRes.body.data[0]._id;

            const res = await request(server)
                .delete(`/api/admin/ratings/${ratingId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('Admin deletes a teacher', async () => {
            const res = await request(server)
                .delete(`/api/admin/teachers/${teacherId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('Deleted teacher returns 404', async () => {
            const res = await request(server)
                .get(`/api/teachers/${teacherId}`);
            expect(res.status).toBe(404);
        });
    });

    describe('Profile Tests', () => {
        test('Get profile', async () => {
            const res = await request(server)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.username).toBe('user1');
        });

        test('Get profile without token fails', async () => {
            const res = await request(server)
                .get('/api/auth/profile');

            expect(res.status).toBe(401);
        });

        test('Update profile with firstName', async () => {
            const res = await request(server)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ 
                    profile: { 
                        firstName: '测试' 
                    } 
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('Update profile with lastName', async () => {
            const res = await request(server)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ 
                    profile: { 
                        lastName: '用户' 
                    } 
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('Update profile with too long firstName fails', async () => {
            const longName = 'a'.repeat(100);
            const res = await request(server)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ 
                    profile: { 
                        firstName: longName
                    } 
                });

            expect(res.status).toBe(400);
        });

        test('Update email to existing email fails', async () => {
            const res = await request(server)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ 
                    email: 'admin@test.com'
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Email already in use');
        });

        test('Update password with short password fails', async () => {
            const res = await request(server)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ 
                    password: '123'
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Password must be between 6 and 100 characters');
        });

        test('Update password with valid password', async () => {
            const res = await request(server)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ 
                    password: 'newpassword123'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('Authorization Tests', () => {
        test('Regular user cannot access admin routes', async () => {
            const res = await request(server)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });

        test('Create teacher without auth fails', async () => {
            const res = await request(server)
                .post('/api/admin/teachers')
                .send({ name: 'test', description: 'test' });

            expect(res.status).toBe(401);
        });

        test('Create teacher without admin role fails', async () => {
            const res = await request(server)
                .post('/api/admin/teachers')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'test', description: 'test' });

            expect(res.status).toBe(403);
        });

        test('Invalid token fails', async () => {
            const res = await request(server)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).toBe(401);
        });

        test('Expired token format fails', async () => {
            const res = await request(server)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');

            expect(res.status).toBe(401);
        });
    });

    describe('Validation Tests', () => {
        test('Register with invalid email format', async () => {
            const res = await request(server)
                .post('/api/auth/register')
                .send({ 
                    username: 'validuser', 
                    email: 'not-an-email', 
                    password: 'password123' 
                });

            expect(res.status).toBe(400);
        });

        test('Register with short username', async () => {
            const res = await request(server)
                .post('/api/auth/register')
                .send({ 
                    username: 'ab', 
                    email: 'ab@test.com', 
                    password: 'password123' 
                });

            expect(res.status).toBe(400);
        });

        test('Register with long username', async () => {
            const res = await request(server)
                .post('/api/auth/register')
                .send({ 
                    username: 'a'.repeat(50), 
                    email: 'long@test.com', 
                    password: 'password123' 
                });

            expect(res.status).toBe(400);
        });

        test('Register with username containing special characters', async () => {
            const res = await request(server)
                .post('/api/auth/register')
                .send({ 
                    username: 'user@test', 
                    email: 'special@test.com', 
                    password: 'password123' 
                });

            expect(res.status).toBe(400);
        });
    });

    describe('Error Handling Tests', () => {
        test('Invalid route returns 404', async () => {
            const res = await request(server)
                .get('/api/invalid-route');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        test('Wrong method on route', async () => {
            const res = await request(server)
                .delete('/api/auth/register');

            expect(res.status).toBe(404);
        });
    })
})
