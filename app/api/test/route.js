import { connectDB } from "@/lib/db";
import { createUser, findUserByEmail } from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    return Response.json({ message: "MongoDB Connected Successfully 🎉" });
  } catch (err) {
    return Response.json({ error: err.message });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));

    const {
      fullName = "Test Student",
      email = "student.test@example.com",
      password = "password123",
      type = "student",
    } = body;

    const existing = await findUserByEmail(email);
    if (existing) {
      return Response.json({ message: "User already exists", userId: existing._id.toString() }, { status: 200 });
    }

    const profile =
      type === "mentor"
        ? {
            type: "mentor",
            department: "Computer Science",
            expertise: ["Web Development"],
            position: "Mentor",
            experience: 0,
            researchAreas: [],
            achievements: [],
            officeHours: "To be scheduled",
            projectsSupervised: [],
            socialLinks: {},
          }
        : {
            type: "student",
            enrollmentNo: "ENR001",
            course: "B.Tech",
            branch: "CSE",
            year: 1,
            skills: [],
            projects: [],
            socialLinks: {},
          };

    const user = await createUser({
      fullName,
      email,
      password,
      type,
      photo: "/default-avatar.png",
      profile,
    });

    const u = user.toObject();
    delete u.password;
    return Response.json({ message: "User created", user: u }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
