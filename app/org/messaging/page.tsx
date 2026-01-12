"use client"

import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { IconSend, IconBell, IconMessage } from "@tabler/icons-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type Event = {
  id: string
  title: string
  startsAt: string
  location: string
  groupChatId: string | null
  lastMessage: {
    body: string
    createdAt: string
    authorType: string
    kind: string
  } | null
  messageCount: number
  signupCount: number
}

type Message = {
  id: string
  body: string
  createdAt: string
  authorType: string
  kind: string
  userId: string | null
  user: {
    id: string
    name: string
    image: string | null
  } | null
  organization: {
    id: string
    name: string | null
    logoUrl: string | null
  } | null
}

type EventDetails = {
  id: string
  title: string
  startsAt: string
  location: string
}

export default function MessagingPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isAnnouncement, setIsAnnouncement] = useState(false)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/org/messaging")
      if (!response.ok) throw new Error("Failed to fetch events")
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error("Error fetching events:", error)
      toast.error("Failed to load events")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMessages = useCallback(async (eventId: string) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    setLoadingMessages(true)
    // Clear messages immediately when switching events
    setMessages([])
    setEventDetails(null)
    
    try {
      const response = await fetch(`/api/org/messaging/${eventId}`, {
        signal: abortController.signal,
      })
      
      if (abortController.signal.aborted) {
        return // Request was cancelled
      }
      
      if (!response.ok) throw new Error("Failed to fetch messages")
      const data = await response.json()
      
      // Double-check we're still fetching for the same event
      if (abortController.signal.aborted) {
        return // Request was cancelled
      }
      
      // Verify the response is for the currently selected event
      if (data.event && data.event.id === eventId) {
        setEventDetails(data.event)
        setMessages(data.messages || [])
      } else {
        console.warn("Received messages for different event, ignoring response", {
          expected: eventId,
          received: data.event?.id,
        })
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, ignore
        return
      }
      console.error("Error fetching messages:", error)
      toast.error("Failed to load messages")
    } finally {
      if (!abortController.signal.aborted) {
        setLoadingMessages(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (selectedEventId) {
      fetchMessages(selectedEventId)
    } else {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      // Clear messages when no event is selected
      setMessages([])
      setEventDetails(null)
      setLoadingMessages(false)
    }
    
    // Cleanup: abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [selectedEventId, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!selectedEventId || !newMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch(`/api/org/messaging/${selectedEventId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: newMessage,
          isAnnouncement: isAnnouncement,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send message")
      }

      const data = await response.json()
      setMessages((prev) => [...prev, data.message])
      setNewMessage("")
      setIsAnnouncement(false)
      
      // Refresh events to update last message
      fetchEvents()
    } catch (error: unknown) {
      console.error("Error sending message:", error)
      const message = error instanceof Error ? error.message : "Failed to send message"
      toast.error(message)
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex items-center gap-2">
            <span className="font-medium">Messaging</span>
          </div>
        </div>
      </header>
      <Separator />
      <div className="flex flex-1 flex-col h-[calc(100vh-4rem)]">
        <div className="flex flex-1 overflow-hidden">
          {/* Events List */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg">Events</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading events...
                </div>
              ) : events.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No events found
                </div>
              ) : (
                <div className="p-2">
                  {events.map((event) => (
                    <Card
                      key={event.id}
                      className={`p-4 mb-2 cursor-pointer transition-colors ${
                        selectedEventId === event.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedEventId(event.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {event.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatEventDate(event.startsAt)}
                          </p>
                          {event.lastMessage && (
                            <div className="mt-2 flex items-center gap-2">
                              {event.lastMessage.kind === "ANNOUNCEMENT" ? (
                                <IconBell className="h-3 w-3 text-muted-foreground shrink-0" />
                              ) : (
                                <IconMessage className="h-3 w-3 text-muted-foreground shrink-0" />
                              )}
                              <p className="text-xs text-muted-foreground truncate">
                                {event.lastMessage.body}
                              </p>
                            </div>
                          )}
                        </div>
                        {event.messageCount > 0 && (
                          <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full shrink-0">
                            {event.messageCount}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col">
            {selectedEventId && eventDetails ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-lg">{eventDetails.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatEventDate(eventDetails.startsAt)} • {eventDetails.location}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <p>Loading messages...</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.authorType === "SYSTEM"
                          ? "justify-center"
                          : "justify-start"
                      }`}
                    >
                      {message.authorType === "USER" && (
                        <Avatar className="h-8 w-8 shrink-0">
                          {message.user?.image && (
                            <AvatarImage src={message.user.image} alt={message.user.name} />
                          )}
                          {message.organization?.logoUrl && (
                            <AvatarImage src={message.organization.logoUrl} alt={message.organization.name || ""} />
                          )}
                          <AvatarFallback>
                            {message.user?.name?.charAt(0) || message.organization?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`flex flex-col max-w-[70%] ${
                          message.authorType === "SYSTEM" ? "items-center" : ""
                        }`}
                      >
                        {message.authorType === "USER" && (
                          <span className="text-xs font-medium text-foreground mb-1">
                            {message.user?.name || message.organization?.name || "Unknown"}
                          </span>
                        )}
                        {message.kind === "ANNOUNCEMENT" && (
                          <div className="flex items-center gap-1 mb-1">
                            <IconBell className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-medium">
                              {message.authorType === "SYSTEM"
                                ? "System Announcement"
                                : "Announcement"}
                            </span>
                          </div>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.authorType === "SYSTEM"
                              ? "bg-muted text-muted-foreground text-sm"
                              : message.kind === "ANNOUNCEMENT"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.body}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="announcement"
                      checked={isAnnouncement}
                      onCheckedChange={(checked) =>
                        setIsAnnouncement(checked === true)
                      }
                    />
                    <Label
                      htmlFor="announcement"
                      className="text-sm font-normal cursor-pointer flex items-center gap-1"
                    >
                      <IconBell className="h-4 w-4" />
                      Send as announcement
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                    >
                      <IconSend className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <IconMessage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an event to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}

