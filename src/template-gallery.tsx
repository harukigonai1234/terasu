import Cards from '@cloudscape-design/components/cards'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Badge from '@cloudscape-design/components/badge'
import Box from '@cloudscape-design/components/box'
import { templates, CATEGORIES, Template } from './templates'

export interface TemplateGalleryProps {
  onSelect: (template: Template) => void
}

export function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  return (
    <SpaceBetween size="l" data-testid="template-gallery">
      <Cards
        items={templates}
        cardDefinition={{
          header: (item) => (
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(item)}
              data-testid={`template-card-${item.id}`}
            >
              {item.title}
            </span>
          ),
          sections: [
            {
              id: 'description',
              content: (item) => <Box color="text-body-secondary">{item.description}</Box>,
            },
            {
              id: 'category',
              content: (item) => <Badge color="blue">{CATEGORIES[item.category]}</Badge>,
            },
          ],
        }}
        header={<Header>Explorations</Header>}
        entireCardClickable
        onSelectionChange={({ detail }) => {
          const selected = detail.selectedItems[0]
          if (selected) onSelect(selected)
        }}
        selectionType="single"
      />
    </SpaceBetween>
  )
}
