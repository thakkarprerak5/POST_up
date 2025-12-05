module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/mongoose [external] (mongoose, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("mongoose", () => require("mongoose"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/Downloads/POST_up-main/models/User.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// models/User.ts
__turbopack_context__.s([
    "createUser",
    ()=>createUser,
    "default",
    ()=>__TURBOPACK__default__export__,
    "findUserByEmail",
    ()=>findUserByEmail,
    "findUserById",
    ()=>findUserById,
    "updateUserProfile",
    ()=>updateUserProfile
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/POST_up-main/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
;
;
// Define profile schema
const profileSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["Schema"]({
    type: {
        type: String,
        enum: [
            'student',
            'mentor'
        ],
        required: true
    },
    joinedDate: {
        type: Date,
        default: Date.now
    },
    bio: {
        type: String,
        default: ''
    },
    enrollmentNo: {
        type: String,
        default: ''
    },
    course: {
        type: String,
        default: ''
    },
    branch: {
        type: String,
        default: ''
    },
    year: {
        type: Number,
        default: 1
    },
    skills: {
        type: [
            String
        ],
        default: []
    },
    department: {
        type: String,
        default: ''
    },
    expertise: {
        type: [
            String
        ],
        default: []
    },
    position: {
        type: String,
        default: ''
    },
    experience: {
        type: Number,
        default: 0
    },
    researchAreas: {
        type: [
            String
        ],
        default: []
    },
    achievements: {
        type: [
            String
        ],
        default: []
    },
    officeHours: {
        type: String,
        default: 'To be scheduled'
    },
    projectsSupervised: [
        {
            id: {
                type: Number
            },
            title: {
                type: String
            },
            image: {
                type: String
            },
            studentName: {
                type: String
            }
        }
    ],
    socialLinks: {
        github: {
            type: String,
            default: ''
        },
        linkedin: {
            type: String,
            default: ''
        },
        portfolio: {
            type: String,
            default: ''
        }
    },
    projects: [
        {
            id: {
                type: String
            },
            title: {
                type: String
            },
            description: {
                type: String
            },
            image: {
                type: String
            },
            url: {
                type: String
            }
        }
    ]
}, {
    _id: false
});
const userSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["Schema"]({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        default: '/placeholder-user.jpg'
    },
    type: {
        type: String,
        enum: [
            'student',
            'mentor'
        ],
        required: true
    },
    profile: {
        type: profileSchema,
        required: true
    }
}, {
    timestamps: true
});
// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].genSalt(10);
    this.password = await __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(this.password, salt);
});
// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(candidatePassword, this.password);
};
// Create model if it doesn't exist
const User = /*TURBOPACK member replacement*/ __turbopack_context__.g.User || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model('User', userSchema);
// For development
if ("TURBOPACK compile-time truthy", 1) {
    /*TURBOPACK member replacement*/ __turbopack_context__.g.User = User;
}
const createUser = async (userData)=>{
    const user = new User(userData);
    return user.save();
};
const findUserByEmail = async (email)=>{
    return User.findOne({
        email
    }).exec();
};
const findUserById = async (id)=>{
    return User.findById(id).exec();
};
const updateUserProfile = async (id, updateData)=>{
    const set = {};
    if (updateData.bio !== undefined) set['profile.bio'] = updateData.bio;
    if (updateData.enrollmentNo !== undefined) set['profile.enrollmentNo'] = updateData.enrollmentNo;
    if (updateData.course !== undefined) set['profile.course'] = updateData.course;
    if (updateData.branch !== undefined) set['profile.branch'] = updateData.branch;
    if (updateData.year !== undefined) set['profile.year'] = updateData.year;
    if (updateData.skills !== undefined) set['profile.skills'] = updateData.skills;
    if (updateData.department !== undefined) set['profile.department'] = updateData.department;
    if (updateData.expertise !== undefined) set['profile.expertise'] = updateData.expertise;
    if (updateData.position !== undefined) set['profile.position'] = updateData.position;
    if (updateData.experience !== undefined) set['profile.experience'] = updateData.experience;
    if (updateData.researchAreas !== undefined) set['profile.researchAreas'] = updateData.researchAreas;
    if (updateData.achievements !== undefined) set['profile.achievements'] = updateData.achievements;
    if (updateData.officeHours !== undefined) set['profile.officeHours'] = updateData.officeHours;
    if (updateData.socialLinks !== undefined) set['profile.socialLinks'] = updateData.socialLinks;
    if (updateData.projects !== undefined) set['profile.projects'] = updateData.projects;
    if (updateData.username !== undefined) set['fullName'] = updateData.username;
    return User.findByIdAndUpdate(id, {
        $set: set
    }, {
        new: true
    }).exec();
};
const __TURBOPACK__default__export__ = User;
}),
"[project]/Downloads/POST_up-main/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/db.ts
__turbopack_context__.s([
    "connectDB",
    ()=>connectDB
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null
    };
}
async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false
        };
        cached.promise = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(MONGODB_URI, opts).then((mongoose)=>{
            return mongoose;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.conn;
}
}),
"[externals]/fs/promises [external] (fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs/promises", () => require("fs/promises"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/Downloads/POST_up-main/app/api/auth/signup/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// app/api/auth/signup/route.ts
__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/POST_up-main/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/POST_up-main/models/User.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/POST_up-main/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/Downloads/POST_up-main/node_modules/uuid/dist-node/v4.js [app-route] (ecmascript) <export default as v4>");
;
;
;
;
;
;
async function POST(req) {
    try {
        console.log('Connecting to database...');
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectDB"])();
        console.log('Successfully connected to database');
        // Parse form data
        const formData = await req.formData();
        // Log form data for debugging
        const formDataObj = Object.fromEntries(formData.entries());
        console.log('Form data received:', formDataObj);
        // Get text fields with proper type checking
        const fullName = formData.get('fullName')?.toString() || '';
        const email = formData.get('email')?.toString()?.toLowerCase() || ''; // Convert email to lowercase
        const password = formData.get('password')?.toString() || '';
        const type = formData.get('type') || 'student';
        const file = formData.get('profileImage');
        // Get role-specific fields with proper type checking
        const enrollmentNo = formData.get('enrollmentNo')?.toString() || '';
        const course = formData.get('course')?.toString() || '';
        const branch = formData.get('branch')?.toString() || '';
        const department = formData.get('department')?.toString() || '';
        const expertise = formData.get('expertise')?.toString() || '';
        // Input validation
        if (!fullName || !email || !password || !type) {
            console.error('Missing required fields');
            return __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing required fields'
            }, {
                status: 400
            });
        }
        // Check if user already exists
        const existingUser = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["findUserByEmail"])(email);
        if (existingUser) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Email already in use'
            }, {
                status: 400
            });
        }
        // Handle file upload
        let photoUrl = '/default-avatar.png';
        if (file && file.size > 0) {
            try {
                // Ensure uploads directory exists
                const uploadsDir = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(process.cwd(), 'public', 'uploads');
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["mkdir"])(uploadsDir, {
                    recursive: true
                });
                // Generate unique filename
                const fileExt = file.name.split('.').pop() || 'png';
                const filename = `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])()}.${fileExt}`;
                const filePath = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(uploadsDir, filename);
                // Convert file to buffer and save
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                // Ensure the uploads directory exists
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["mkdir"])(uploadsDir, {
                    recursive: true
                });
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["writeFile"])(filePath, buffer);
                photoUrl = `/uploads/${filename}`;
            } catch (fileError) {
                console.error('Error saving file:', fileError);
            // Continue with default avatar
            }
        }
        // Create user with profile based on type
        const userData = {
            fullName: fullName.trim(),
            email: email.trim(),
            password: password,
            type,
            photo: photoUrl,
            profile: {
                type,
                joinedDate: new Date(),
                bio: '',
                socialLinks: {},
                ...type === 'student' ? {
                    enrollmentNo: enrollmentNo.trim(),
                    course: course.trim(),
                    branch: branch.trim(),
                    year: 1,
                    skills: [],
                    projects: []
                } : {
                    department: department.trim(),
                    expertise: expertise ? expertise.split(',').map((e)=>e.trim()).filter(Boolean) : [],
                    position: 'Mentor',
                    experience: 0,
                    researchAreas: [],
                    achievements: [],
                    officeHours: 'To be scheduled',
                    projectsSupervised: []
                }
            }
        };
        console.log('Creating user with data:', JSON.stringify(userData, null, 2));
        // Create the user
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createUser"])(userData);
        console.log('User created successfully:', user._id);
        // Convert Mongoose document to plain object and remove sensitive data
        const userResponse = user.toObject();
        delete userResponse.password;
        return __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                fullName: user.fullName,
                type: user.type,
                photo: user.photo,
                profile: user.profile
            }
        }, {
            status: 201
        });
    } catch (error) {
        console.error('Signup error:', error);
        // Log detailed error information
        const errorDetails = {
            message: error.message,
            name: error.name,
            code: error.code,
            keyPattern: error.keyPattern,
            keyValue: error.keyValue,
            ...error.errors && {
                errors: Object.entries(error.errors).reduce((acc, [key, value])=>{
                    acc[key] = value.message;
                    return acc;
                }, {})
            }
        };
        console.error('Error details:', JSON.stringify(errorDetails, null, 2));
        // Handle specific errors
        if (error.name === 'MongoServerError' && error.code === 11000) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Email already in use. Please use a different email or log in.'
            }, {
                status: 400
            });
        }
        if (error.name === 'ValidationError') {
            const errorMessages = error.errors ? Object.values(error.errors).map((e)=>e.message) : [
                'Validation failed. Please check your input.'
            ];
            return __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Validation failed',
                details: errorMessages
            }, {
                status: 400
            });
        }
        // For other errors, return a generic message in production
        const errorMessage = ("TURBOPACK compile-time truthy", 1) ? error.message : "TURBOPACK unreachable";
        return __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$POST_up$2d$main$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: errorMessage,
            ...("TURBOPACK compile-time value", "development") === 'development' && {
                stack: error.stack,
                details: errorDetails
            }
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4b7ac4ac._.js.map