import { useState, useEffect } from 'react'
import { Users, UserPlus, Crown, Shield, Eye, Edit, Share2, MessageSquare, Calendar, Settings, MoreVertical, Search } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.jsx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx'

const ROLE_PERMISSIONS = {
  owner: {
    name: 'Owner',
    color: 'bg-purple-100 text-purple-800',
    icon: Crown,
    permissions: ['all']
  },
  admin: {
    name: 'Admin',
    color: 'bg-red-100 text-red-800',
    icon: Shield,
    permissions: ['manage_users', 'manage_projects', 'edit_all', 'view_all']
  },
  editor: {
    name: 'Editor',
    color: 'bg-blue-100 text-blue-800',
    icon: Edit,
    permissions: ['edit_assigned', 'view_all', 'comment']
  },
  viewer: {
    name: 'Viewer',
    color: 'bg-gray-100 text-gray-800',
    icon: Eye,
    permissions: ['view_assigned', 'comment']
  }
}

export function TeamCollaboration({ user }) {
  const [team, setTeam] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [invitations, setInvitations] = useState([])
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('viewer')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadTeamData()
  }, [])

  const loadTeamData = async () => {
    setIsLoading(true)
    try {
      // Simulated data - replace with actual API calls
      setTeam({
        id: 1,
        name: 'Acme Corporation',
        plan: 'Professional',
        created_at: '2024-01-15T10:30:00Z',
        settings: {
          default_role: 'viewer',
          project_visibility: 'team',
          allow_external_sharing: false
        }
      })

      setTeamMembers([
        {
          id: 1,
          email: 'john.doe@acme.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'owner',
          status: 'active',
          joined_at: '2024-01-15T10:30:00Z',
          last_active: '2024-01-20T14:22:00Z',
          avatar_url: null
        },
        {
          id: 2,
          email: 'jane.smith@acme.com',
          first_name: 'Jane',
          last_name: 'Smith',
          role: 'admin',
          status: 'active',
          joined_at: '2024-01-16T09:15:00Z',
          last_active: '2024-01-19T16:45:00Z',
          avatar_url: null
        },
        {
          id: 3,
          email: 'bob.wilson@acme.com',
          first_name: 'Bob',
          last_name: 'Wilson',
          role: 'editor',
          status: 'active',
          joined_at: '2024-01-18T11:20:00Z',
          last_active: '2024-01-18T17:30:00Z',
          avatar_url: null
        }
      ])

      setProjects([
        {
          id: 1,
          name: 'Q4 Sales Analysis',
          description: 'Quarterly sales performance review',
          owner: 'John Doe',
          collaborators: 3,
          last_modified: '2024-01-20T14:22:00Z',
          status: 'active',
          visibility: 'team'
        },
        {
          id: 2,
          name: 'Customer Segmentation',
          description: 'Market research and customer analysis',
          owner: 'Jane Smith',
          collaborators: 2,
          last_modified: '2024-01-19T16:45:00Z',
          status: 'active',
          visibility: 'private'
        }
      ])

      setInvitations([
        {
          id: 1,
          email: 'alice.johnson@acme.com',
          role: 'editor',
          invited_by: 'John Doe',
          invited_at: '2024-01-19T10:00:00Z',
          status: 'pending'
        }
      ])
    } catch (error) {
      console.error('Failed to load team data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const inviteMember = async () => {
    if (!newMemberEmail.trim()) return

    setIsLoading(true)
    try {
      // Simulated API call
      const invitation = {
        id: Date.now(),
        email: newMemberEmail,
        role: newMemberRole,
        invited_by: `${user.first_name} ${user.last_name}`,
        invited_at: new Date().toISOString(),
        status: 'pending'
      }

      setInvitations([...invitations, invitation])
      setNewMemberEmail('')
      setNewMemberRole('viewer')
      setShowInviteDialog(false)
    } catch (error) {
      console.error('Failed to invite member:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateMemberRole = async (memberId, newRole) => {
    setTeamMembers(members =>
      members.map(member =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
    )
  }

  const removeMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    setTeamMembers(members => members.filter(member => member.id !== memberId))
  }

  const cancelInvitation = async (invitationId) => {
    setInvitations(invitations => invitations.filter(inv => inv.id !== invitationId))
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const getRoleInfo = (role) => ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Team Collaboration</h2>
          <p className="text-gray-600">Manage your team and collaborative projects</p>
        </div>
        
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team workspace
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="colleague@company.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer - Can view assigned projects</SelectItem>
                    <SelectItem value="editor">Editor - Can edit assigned projects</SelectItem>
                    <SelectItem value="admin">Admin - Can manage team and all projects</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={inviteMember} disabled={isLoading || !newMemberEmail.trim()}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Overview */}
      {team && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{teamMembers.length}</div>
                  <div className="text-sm text-gray-600">Team Members</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{projects.length}</div>
                  <div className="text-sm text-gray-600">Active Projects</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{invitations.length}</div>
                  <div className="text-sm text-gray-600">Pending Invites</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800">{team.plan}</Badge>
                <div className="text-sm text-gray-600">Plan</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Members</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input placeholder="Search members..." className="pl-10 w-64" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => {
                  const roleInfo = getRoleInfo(member.role)
                  const RoleIcon = roleInfo.icon
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>
                            {getInitials(member.first_name, member.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="font-semibold">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-sm text-gray-600">{member.email}</div>
                          <div className="text-xs text-gray-500">
                            Last active: {new Date(member.last_active).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={roleInfo.color}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleInfo.name}
                        </Badge>
                        
                        {member.role !== 'owner' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'admin')}>
                                Change to Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'editor')}>
                                Change to Editor
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'viewer')}>
                                Change to Viewer
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => removeMember(member.id)}
                                className="text-red-600"
                              >
                                Remove from Team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Collaborative Projects</CardTitle>
                <Button>
                  <Share2 className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">{project.name}</h3>
                        <Badge variant={project.visibility === 'team' ? 'default' : 'secondary'}>
                          {project.visibility}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Owner: {project.owner}</span>
                        <span>{project.collaborators} collaborators</span>
                        <span>Modified: {new Date(project.last_modified).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Members who have been invited but haven't joined yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No pending invitations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => {
                    const roleInfo = getRoleInfo(invitation.role)
                    
                    return (
                      <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-semibold">{invitation.email}</div>
                          <div className="text-sm text-gray-600">
                            Invited by {invitation.invited_by} • {new Date(invitation.invited_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={roleInfo.color}>
                            {roleInfo.name}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => cancelInvitation(invitation.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>
                Configure team-wide preferences and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input value={team?.name || ''} />
              </div>
              
              <div className="space-y-2">
                <Label>Default Role for New Members</Label>
                <Select defaultValue="viewer">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Project Visibility</Label>
                <Select defaultValue="team">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private by default</SelectItem>
                    <SelectItem value="team">Team visible by default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4">
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
