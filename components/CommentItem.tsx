"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClickableProfilePhoto } from "@/components/clickable-profile-photo";
import { Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { withReportable } from "@/components/ui/ReportSystem";

interface CommentItemProps {
    comment: any;
    index: number;
    currentUser: any;
    onProfilePhotoClick: (imageUrl: string, name: string) => void;
    onDelete: (commentId: string) => void;
    onEdit: (commentId: string, newContent: string) => void;
    editingCommentId: string | null;
    setEditingCommentId: (id: string | null) => void;
}

const CommentItemBase = ({
    comment,
    index,
    currentUser,
    onProfilePhotoClick,
    onDelete,
    onEdit,
    editingCommentId,
    setEditingCommentId
}: CommentItemProps) => {
    const [editingText, setEditingText] = useState("");
    const commentId = comment.id || `comment-${index}`;
    const isAuthor = currentUser && (comment.userId === currentUser.id || comment.author?.id === currentUser.id);
    const isEditing = editingCommentId === commentId;

    const handleStartEdit = () => {
        setEditingCommentId(commentId);
        setEditingText(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditingText("");
    };

    const handleSaveEdit = () => {
        onEdit(commentId, editingText);
        handleCancelEdit();
    };

    return (
        <div className="bg-muted/50 rounded-lg p-3 group">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <ClickableProfilePhoto
                        imageUrl={comment.author?.photo}
                        avatar="/placeholder-user.jpg"
                        name={comment.author?.fullName || 'Unknown User'}
                        size="sm"
                        className="h-6 w-6"
                        onPhotoClick={onProfilePhotoClick}
                    />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                            {comment.author?.fullName || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt))}
                        </p>
                    </div>
                </div>

                {/* Comment Actions */}
                {isAuthor && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleStartEdit}
                            className="h-6 w-6 p-1 hover:bg-muted/50"
                            title="Edit comment"
                        >
                            <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(commentId)}
                            className="h-6 w-6 p-1 hover:bg-red-50 hover:text-red-600"
                            title="Delete comment"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Comment Content */}
            {isEditing ? (
                <div className="space-y-2 mt-2">
                    <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        rows={3}
                        placeholder="Edit your comment..."
                    />
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveEdit}
                        >
                            Save
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-foreground leading-relaxed mt-2" onContextMenu={(e) => {
                    // Prevent default only if it's the right click to show our custom menu triggers
                    // The withReportable HOC handles the context menu event bubbling.
                }}>
                    {comment.content}
                </p>
            )}
        </div>
    );
};

export const CommentItem = withReportable(CommentItemBase);
