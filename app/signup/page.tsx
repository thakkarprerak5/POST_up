"use client";
import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
// Using browser's alert for notifications

export default function Signup() {
  const [option, setOption] = useState<"a" | "b" | "">(""); // 'a' for student, 'b' for mentor
  const [image, setImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState(""); // For students
  const [course, setCourse] = useState(""); // For students
  const [branch, setBranch] = useState(""); // For students
  const [department, setDepartment] = useState(""); // For mentors
  const [expertise, setExpertise] = useState(""); // For mentors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read the file');
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic validation
    if (!image) {
      setError("Please upload a profile photo!");
      setIsLoading(false);
      return;
    }

    if (!fullName || !email || !password) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (option === 'a' && (!enrollmentNo || !course || !branch)) {
      setError("Please fill in all student details");
      setIsLoading(false);
      return;
    }

    if (option === 'b' && (!department || !expertise)) {
      setError("Please fill in all mentor details");
      setIsLoading(false);
      return;
    }

    try {
      // Prepare form data for file upload
      const formData = new FormData();
      if (fileInputRef.current?.files?.[0]) {
        formData.append('profileImage', fileInputRef.current.files[0]);
      }
      
      // Add other user data
      const userData = {
        fullName,
        email,
        password,
        type: option === "a" ? "student" : "mentor",
        ...(option === "a"
          ? {
              enrollmentNo,
              course,
              branch,
            }
          : {
              department,
              expertise: expertise.split(',').map(e => e.trim()),
            }),
      };

      // Add user data to form data
      Object.entries(userData).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value as string | Blob);
        }
      });

      // Show loading state
      setIsSubmitting(true);
      setError('');

      try {
        // Send request to API
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          body: formData, // No need to set Content-Type header when using FormData
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle API validation errors
          if (data.details && Array.isArray(data.details)) {
            throw new Error(data.details.join('\n'));
          }
          throw new Error(data.error || 'Signup failed. Please check your information and try again.');
        }

        // Log success for debugging
        console.log('Signup successful:', data);

        // Show success message and redirect
        alert('Account created successfully! You will be redirected to login.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } catch (error) {
        console.error('Signup error:', error);
        
        // Set error message, handling both Error objects and string errors
        const errorMessage = error instanceof Error ? error.message : 'Failed to create account. Please try again.';
        setError(errorMessage);
        
        // Scroll to error message for better UX
        if (errorRef.current) {
          errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } finally {
        setIsSubmitting(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Create Account
        </h2>

        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!option ? (
            <div>
              <label className="font-semibold text-gray-200">Who Are You?</label>
              <select
                className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={option}
                onChange={(e) => setOption(e.target.value as "a" | "b")}
                required
              >
                <option value="">-- Select --</option>
                <option value="a">Student</option>
                <option value="b">Mentor</option>
              </select>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  {option === "a" ? "Student" : "Mentor"} Registration
                </h3>
                <button
                  type="button"
                  onClick={() => setOption("")}
                  className="text-sm text-blue-400 hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center mb-6">
                <div className="relative w-32 h-32 mb-4">
                  <div 
                    onClick={triggerFileInput}
                    className="w-full h-full rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt="Profile preview"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-xs text-gray-400">Upload Photo</span>
                      </div>
                    )}
                  </div>
                  {image && (
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      aria-label="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  required
                />
                <p className="text-xs text-gray-400 text-center">
                  JPG, PNG (max. 2MB)
                </p>
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    minLength={6}
                    required
                  />
                </div>

                {option === "a" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Enrollment Number
                      </label>
                      <input
                        type="text"
                        value={enrollmentNo}
                        onChange={(e) => setEnrollmentNo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Course
                      </label>
                      <input
                        type="text"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Branch
                      </label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Expertise (comma separated)
                      </label>
                      <input
                        type="text"
                        value={expertise}
                        onChange={(e) => setExpertise(e.target.value)}
                        placeholder="e.g., Web Development, Machine Learning"
                        className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center mt-4 text-gray-400">
          Already have an account?{" "}
          <a href="/login" className="text-blue-400 font-semibold hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}