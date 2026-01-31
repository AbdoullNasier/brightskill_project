import React, { useState } from 'react';
import { MdSearch, MdAdd, MdComment, MdThumbUp, MdVisibility } from 'react-icons/md';

const Forum = () => {
    const [posts, setPosts] = useState([
        {
            id: 1,
            title: "How to handle a difficult negotiation?",
            author: "Sarah J.",
            role: "Learner",
            category: "Course Help",
            replies: 12,
            views: 340,
            likes: 45,
            time: "2 hours ago",
            body: "I'm currently taking the Negotiation Masterclass and I'm stuck on how to handle a situation where the other party refuses to budge on price. Any tips from those who have finished the module?",
            comments: [
                { id: 101, author: "Jane D.", role: "Expert", text: "Try focusing on non-monetary value. What else can you offer?", time: "1 hour ago" }
            ]
        },
        {
            id: 2,
            title: "Success Story: Landed a job after AI Interview practice!",
            author: "Michael B.",
            role: "Alumni",
            category: "Success Stories",
            replies: 28,
            views: 1205,
            likes: 156,
            time: "1 day ago",
            body: "I just wanted to share that after practicing with the AI interviewer for 2 weeks, I finally nailed my interview at a top tech firm! The behavioral questions were almost identical. Keep practicing, it works!",
            comments: []
        },
        {
            id: 3,
            title: "Best resources for emotional intelligence?",
            author: "David L.",
            role: "Learner",
            category: "General",
            replies: 5,
            views: 89,
            likes: 12,
            time: "3 days ago",
            body: "Apart from the course material here, what other books or podcasts do you recommend for improving EQ? I feel like I need more examples.",
            comments: []
        }
    ]);

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [showNewPostModal, setShowNewPostModal] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState("");
    const [newPostBody, setNewPostBody] = useState("");
    const [newPostCategory, setNewPostCategory] = useState("General");

    const categories = ['All', 'General', 'Course Help', 'Career Advice', 'Success Stories'];

    const filteredPosts = selectedCategory === 'All'
        ? posts
        : posts.filter(post => post.category === selectedCategory);

    const handleCreatePost = (e) => {
        e.preventDefault();
        const newPost = {
            id: posts.length + 1,
            title: newPostTitle,
            author: "You",
            role: "Learner",
            category: newPostCategory,
            replies: 0,
            views: 0,
            likes: 0,
            time: "Just now",
            body: newPostBody,
            comments: []
        };
        setPosts([newPost, ...posts]);
        setShowNewPostModal(false);
        setNewPostTitle("");
        setNewPostBody("");
        setNewPostCategory("General");
    };

    const handlePostComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setPosts(posts.map(post => {
            if (post.id === selectedPostId) {
                return {
                    ...post,
                    comments: [
                        ...post.comments,
                        {
                            id: Date.now(),
                            author: "You",
                            role: "Learner",
                            text: newComment,
                            time: "Just now"
                        }
                    ],
                    replies: post.replies + 1
                };
            }
            return post;
        }));
        setNewComment("");
    };

    const selectedPost = posts.find(p => p.id === selectedPostId);

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Community Forum</h1>
                        <p className="text-gray-500">Discuss, share, and learn with peers.</p>
                    </div>
                    <button
                        onClick={() => setShowNewPostModal(true)}
                        className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
                    >
                        <MdAdd className="mr-2" /> New Post
                    </button>
                </div>

                {/* Content Area */}
                {selectedPost ? (
                    // Detail View
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <button
                                onClick={() => setSelectedPostId(null)}
                                className="text-sm text-gray-500 hover:text-primary mb-4 flex items-center"
                            >
                                ← Back to discussions
                            </button>

                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedPost.category === 'Success Stories' ? 'bg-green-100 text-green-700' :
                                    selectedPost.category === 'Course Help' ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {selectedPost.category}
                                </span>
                                <span className="text-xs text-gray-400">• {selectedPost.time}</span>
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedPost.title}</h1>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                                    {selectedPost.author[0]}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{selectedPost.author}</div>
                                    <div className="text-xs text-gray-500">{selectedPost.role}</div>
                                </div>
                            </div>

                            <div className="prose max-w-none text-gray-700 leading-relaxed mb-8">
                                {selectedPost.body}
                            </div>

                            <div className="flex items-center gap-6 border-t border-gray-100 pt-4 text-gray-500">
                                <button className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <MdThumbUp size={20} /> Like ({selectedPost.likes})
                                </button>
                                <button className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <MdComment size={20} /> Reply ({selectedPost.replies})
                                </button>
                                <div className="flex items-center gap-2 ml-auto">
                                    <MdVisibility size={20} /> {selectedPost.views} Views
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="bg-gray-50 p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Comments ({selectedPost.comments.length})</h3>

                            <div className="space-y-4 mb-6">
                                {selectedPost.comments.length > 0 ? (
                                    selectedPost.comments.map(comment => (
                                        <div key={comment.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold text-sm">{comment.author}</span>
                                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">{comment.role}</span>
                                                <span className="text-gray-400 text-xs">• {comment.time}</span>
                                            </div>
                                            <p className="text-gray-700 text-sm">{comment.text}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-400 italic">
                                        No comments yet. Be the first to start the conversation!
                                    </div>
                                )}
                            </div>

                            {/* Comment Input */}
                            <form onSubmit={handlePostComment} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                                    Y
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Post
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    // List View
                    <>
                        {/* Search & Categories */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <MdSearch className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search discussions..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${selectedCategory === cat
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Posts List */}
                        <div className="space-y-4">
                            {filteredPosts.map(post => (
                                <div
                                    key={post.id}
                                    onClick={() => setSelectedPostId(post.id)}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${post.category === 'Success Stories' ? 'bg-green-100 text-green-700' :
                                                    post.category === 'Course Help' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {post.category}
                                                </span>
                                                <span className="text-xs text-gray-400">• {post.time}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800 mb-2">{post.title}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span className="font-medium text-gray-700">{post.author}</span>
                                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{post.role}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 text-gray-400 text-sm">
                                            <div className="flex items-center gap-1" title="Replies">
                                                <MdComment /> {post.replies}
                                            </div>
                                            <div className="flex items-center gap-1" title="Views">
                                                <MdVisibility /> {post.views}
                                            </div>
                                            <div className="flex items-center gap-1" title="Likes">
                                                <MdThumbUp /> {post.likes}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredPosts.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No discussions found in this category.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* New Post Modal */}
            {showNewPostModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Create New Discussion</h2>
                        <form onSubmit={handleCreatePost}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newPostTitle}
                                    onChange={(e) => setNewPostTitle(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                    placeholder="What's on your mind?"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={newPostCategory}
                                    onChange={(e) => setNewPostCategory(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                >
                                    {categories.filter(c => c !== 'All').map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary h-32"
                                    placeholder="Elaborate on your question or thought..."
                                    value={newPostBody}
                                    onChange={(e) => setNewPostBody(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowNewPostModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    Post
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Forum;
